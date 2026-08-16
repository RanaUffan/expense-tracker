// Entry point for LOCAL development only.
// (On Vercel, api/index.js is used instead — see vercel.json.)
import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});
