// /api/save.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { name, num, imgUrl } = JSON.parse(req.body);

  // Секретные данные берем из переменных окружения Vercel
  const TOKEN = process.env.GH_TOKEN; 
  const REPO_OWNER = process.env.GH_OWNER;
  const REPO_NAME = process.env.GH_NAME;
  const FILE_PATH = 'data.json';

  try {
    // 1. Получаем текущее содержимое data.json, чтобы узнать SHA
    const getFileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${TOKEN}` }
    });
    const fileData = await getFileRes.json();
    const currentBuilds = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

    // 2. Добавляем новый билд в массив
    const newBuild = { id: Date.now(), name, num, imgUrl, date: new Date().toISOString() };
    const updatedBuilds = [...currentBuilds, newBuild];

    // 3. Отправляем обновленный файл обратно в GitHub
    const updateFileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add build for ${name}`,
        content: Buffer.from(JSON.stringify(updatedBuilds, null, 2)).toString('base64'),
        sha: fileData.sha // Обязательно для обновления
      })
    });

    if (updateFileRes.ok) {
      res.status(200).json({ success: true });
    } else {
      throw new Error('Failed to update GitHub');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
