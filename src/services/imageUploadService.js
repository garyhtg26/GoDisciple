const API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

// Uploads a base64-encoded image to ImgBB and returns its permanent public URL.
export async function uploadImage(base64) {
  if (!API_KEY) throw new Error('Image upload is not configured.');

  const body = new FormData();
  body.append('image', base64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
    method: 'POST',
    body,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json?.error?.message || 'Image upload failed.');
  }
  return json.data.display_url;
}
