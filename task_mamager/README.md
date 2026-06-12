# Task Manager

A clean, minimal task management app built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies.

## Features

- Add tasks with priority levels (High / Medium / Low)
- Mark tasks as complete / incomplete
- Delete tasks
- Filter by status (All / Active / Completed) or priority
- Live stats: total, completed, and remaining counts
- Tasks persist in `localStorage` across page refreshes
- Fully responsive — works on mobile and desktop
- Dark mode support via `prefers-color-scheme`

## Getting Started

No build step needed. Just open `index.html` in a browser:

```bash
git clone https://github.com/YOUR_USERNAME/task-manager.git
cd task-manager
open index.html
```

Or serve it locally:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Project Structure

```
task-manager/
├── index.html   # Markup and layout
├── style.css    # All styles (light + dark mode)
├── app.js       # State, actions, and rendering
└── README.md
```

## Deploying to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose `main` branch and `/ (root)` folder
5. Click **Save** — your app will be live at `https://YOUR_USERNAME.github.io/task-manager`

## License

MIT
