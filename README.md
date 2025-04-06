# 🏏 Hand Cricket

## 🎯 Project Vision

Hand Cricket is a fun, nostalgic digital version of the classic finger-based cricket game we all played during school breaks. The goal is to simulate the game online with smooth animations, intuitive UI, and the original excitement of trying to outscore your opponent.

Whether you're reliving your childhood or discovering it for the first time, this project offers a lightweight and engaging experience — playable from any device, anytime.

---

## 🕹️ How to Play

- Both the player and the opponent (computer or another player) choose a number between **1 to 6**.
- If the numbers **match**, the batter is **out**.
- If the numbers **don’t match**, the batter scores **runs equal to their number**.
- The innings continues until all wickets are lost or the target is chased (in 2-player mode).

---

## 🚀 Getting Started

### Prerequisites

Before running the app locally, make sure the following are installed:

- [Node.js](https://nodejs.org/) (v16 or above recommended)
- npm (comes with Node.js)

### Installation Steps

```bash
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Move into the project directory
cd hand-cricket

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

---

## ⚙️ Technologies Used

- **React** – JavaScript library for building user interfaces
- **Vite** – Fast and optimized build tool
- **TypeScript** – Adds static typing to JavaScript
- **Tailwind CSS** – Utility-first CSS framework for rapid UI development
- **shadcn-ui** – Pre-styled components using Radix UI + Tailwind

---

## 🛠 Editing the Code

### 💻 Local Development (Preferred)

1. Open the cloned project in your preferred IDE (like VS Code).
2. Edit any source files inside the `src/` folder.
3. Saved changes will automatically reflect in the browser thanks to hot module reload.

### 🌐 Edit via GitHub

1. Open the desired file in the repository.
2. Click the **✏️ Edit** button (top-right of the file).
3. Make your changes and click **Commit changes**.

### 🧠 Use GitHub Codespaces

1. Open your repository on GitHub.
2. Click on the green **Code** button.
3. Select the **Codespaces** tab.
4. Click **Create codespace on main** to launch a browser-based development environment.

---

## 📦 Deployment

You can deploy the Hand Cricket app using any of the following platforms:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Render](https://render.com/)
- GitHub Pages (with configuration)

### To build for production:

```bash
npm run build
```

This will generate an optimized static site inside the `dist/` folder. Upload that folder to your hosting provider.

---

## 🌐 Custom Domain Setup

After deployment, you can connect your own domain:

- Go to your hosting provider's dashboard (e.g., Vercel, Netlify).
- Open your project settings.
- Look for **Domain** or **Custom Domain** options.
- Add your domain name (e.g., `playhandcricket.com`).
- Update DNS settings in your domain registrar to point to the provided IP or CNAME.

---

Happy Playing! ✨  
Feel free to contribute or suggest new features like multiplayer mode, animations, or scoreboards!
```

Let me know if you’d like to include images, badges (e.g., "Built With Vite", "Made with Love"), or a `CONTRIBUTING.md` section too!
