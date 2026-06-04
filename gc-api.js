const GC_STORAGE_KEY = 'gc_v2_site_data';

function gcClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function gcCreateDefaultData() {
  const data = gcClone(window.GC_DEFAULT_DATA);
  const now = Date.now();
  data.posts = data.posts.map(post => ({
    ...post,
    createdAt: post.createdAt || now - Number(post.createdAtOffsetMinutes || 0) * 60 * 1000,
    comments: Array.isArray(post.comments) ? post.comments : []
  }));
  return data;
}

function gcLocalGetData() {
  const raw = localStorage.getItem(GC_STORAGE_KEY);
  if (!raw) {
    const data = gcCreateDefaultData();
    gcLocalSaveData(data);
    return data;
  }
  try {
    const data = JSON.parse(raw);
    if (!data.site || !Array.isArray(data.categories) || !Array.isArray(data.posts)) {
      throw new Error('Invalid local data');
    }
    return data;
  } catch {
    const data = gcCreateDefaultData();
    gcLocalSaveData(data);
    return data;
  }
}

function gcLocalSaveData(data) {
  localStorage.setItem(GC_STORAGE_KEY, JSON.stringify(data));
}

function gcHasSupabaseConfig() {
  return Boolean(
    window.GC_SUPABASE_CONFIG &&
    window.GC_SUPABASE_CONFIG.url &&
    window.GC_SUPABASE_CONFIG.anonKey &&
    window.supabase
  );
}

function gcSupabaseClient() {
  if (!gcHasSupabaseConfig()) return null;
  if (!window.__GC_SUPABASE_CLIENT__) {
    window.__GC_SUPABASE_CLIENT__ = window.supabase.createClient(
      window.GC_SUPABASE_CONFIG.url,
      window.GC_SUPABASE_CONFIG.anonKey
    );
  }
  return window.__GC_SUPABASE_CLIENT__;
}

function gcIsCloudMode() {
  return Boolean(gcSupabaseClient());
}

async function gcLoadData() {
  const client = gcSupabaseClient();
  if (!client) return gcLocalGetData();

  const [settingsResult, categoriesResult, postsResult, commentsResult] = await Promise.all([
    client.from('gc_settings').select('data').eq('id', 'site').single(),
    client.from('gc_categories').select('id,name,tagline,orb_class,sort_order').order('sort_order', { ascending: true }),
    client.from('gc_posts').select('id,category_id,title,content,created_at').eq('is_published', true).order('created_at', { ascending: false }),
    client.from('gc_comments').select('id,post_id,content,created_at').eq('is_published', true).order('created_at', { ascending: true })
  ]);

  const hasError = settingsResult.error || categoriesResult.error || postsResult.error || commentsResult.error;
  if (hasError) {
    console.warn('Supabase load failed, fallback to local data:', hasError);
    return gcLocalGetData();
  }

  const commentsByPost = new Map();
  for (const comment of commentsResult.data || []) {
    const list = commentsByPost.get(comment.post_id) || [];
    list.push(comment.content);
    commentsByPost.set(comment.post_id, list);
  }

  return {
    version: 3,
    site: settingsResult.data?.data || gcCreateDefaultData().site,
    categories: (categoriesResult.data || []).map(category => ({
      id: category.id,
      name: category.name,
      tagline: category.tagline,
      orbClass: category.orb_class
    })),
    posts: (postsResult.data || []).map(post => ({
      id: post.id,
      category: post.category_id,
      title: post.title,
      content: post.content,
      createdAt: new Date(post.created_at).getTime(),
      comments: commentsByPost.get(post.id) || []
    }))
  };
}

async function gcSaveSite(site) {
  const client = gcSupabaseClient();
  if (!client) {
    const data = gcLocalGetData();
    data.site = site;
    gcLocalSaveData(data);
    return;
  }
  const { error } = await client
    .from('gc_settings')
    .upsert({ id: 'site', data: site, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function gcSaveCategory(category) {
  const client = gcSupabaseClient();
  if (!client) {
    const data = gcLocalGetData();
    const target = data.categories.find(item => item.id === category.id);
    if (target) Object.assign(target, category);
    gcLocalSaveData(data);
    return;
  }
  const { error } = await client
    .from('gc_categories')
    .update({
      name: category.name,
      tagline: category.tagline,
      orb_class: category.orbClass,
      updated_at: new Date().toISOString()
    })
    .eq('id', category.id);
  if (error) throw error;
}

async function gcCreatePost({ category, title, content }) {
  const client = gcSupabaseClient();
  if (!client) {
    const data = gcLocalGetData();
    const post = {
      id: `post_${Date.now()}`,
      category,
      title,
      content,
      createdAt: Date.now(),
      comments: []
    };
    data.posts.unshift(post);
    gcLocalSaveData(data);
    return post;
  }
  const { data, error } = await client
    .from('gc_posts')
    .insert({ category_id: category, title, content, is_published: true })
    .select('id,category_id,title,content,created_at')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    category: data.category_id,
    title: data.title,
    content: data.content,
    createdAt: new Date(data.created_at).getTime(),
    comments: []
  };
}

async function gcUpdatePost(post) {
  const client = gcSupabaseClient();
  if (!client) {
    const data = gcLocalGetData();
    const target = data.posts.find(item => item.id === post.id);
    if (target) Object.assign(target, post);
    gcLocalSaveData(data);
    return;
  }

  const { error: postError } = await client
    .from('gc_posts')
    .update({
      category_id: post.category,
      title: post.title,
      content: post.content,
      updated_at: new Date().toISOString()
    })
    .eq('id', post.id);
  if (postError) throw postError;

  const { error: deleteError } = await client
    .from('gc_comments')
    .delete()
    .eq('post_id', post.id);
  if (deleteError) throw deleteError;

  const comments = (post.comments || []).filter(Boolean).map(content => ({
    post_id: post.id,
    content,
    is_published: true
  }));
  if (comments.length) {
    const { error: insertError } = await client.from('gc_comments').insert(comments);
    if (insertError) throw insertError;
  }
}

async function gcDeletePost(postId) {
  const client = gcSupabaseClient();
  if (!client) {
    const data = gcLocalGetData();
    data.posts = data.posts.filter(post => post.id !== postId);
    gcLocalSaveData(data);
    return;
  }
  const { error } = await client.from('gc_posts').delete().eq('id', postId);
  if (error) throw error;
}

async function gcAddComment(postId, content) {
  const client = gcSupabaseClient();
  if (!client) {
    const data = gcLocalGetData();
    const post = data.posts.find(item => item.id === postId);
    if (post) {
      post.comments = post.comments || [];
      post.comments.push(content);
      gcLocalSaveData(data);
    }
    return;
  }
  const { error } = await client.from('gc_comments').insert({ post_id: postId, content, is_published: true });
  if (error) throw error;
}

async function gcSignInAdmin(email, password) {
  const client = gcSupabaseClient();
  if (!client) return { local: true };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: adminData, error: adminError } = await client.from('gc_admins').select('user_id').eq('user_id', data.user.id).single();
  if (adminError || !adminData) {
    await client.auth.signOut();
    throw new Error('这个账号不是管理员');
  }
  return data;
}

async function gcSignOutAdmin() {
  const client = gcSupabaseClient();
  if (client) await client.auth.signOut();
}
