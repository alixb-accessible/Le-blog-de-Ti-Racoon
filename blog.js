// blog.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config (remplace par la tienne si nécessaire)
const firebaseConfig = {
  apiKey: "AIzaSyAf5L19V1ktK9wKGU87P30xNN9jde4-_Eg",
  authDomain: "page-admin-tiracoon-blog.firebaseapp.com",
  projectId: "page-admin-tiracoon-blog",
  storageBucket: "page-admin-tiracoon-blog.firebasestorage.app",
  messagingSenderId: "1091401553072",
  appId: "1:1091401553072:web:0ddc04b952de5ed1225775"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Conteneur articles
const articlesContainer = document.getElementById("articles");
const blogTitle = document.getElementById("blog-title");
const blogSubtitle = document.getElementById("blog-subtitle");
const blogIntro = document.getElementById("blog-intro");

// Fonction pour créer un article HTML
function createArticleHTML(article) {
  const div = document.createElement("div");
  div.classList.add("article", "mb-12", "p-4", "bg-white", "rounded-lg", "shadow-md");

  // Titre
  const h2 = document.createElement("h2");
  h2.textContent = article.title;
  h2.classList.add("text-3xl", "font-bold", "mb-2");
  div.appendChild(h2);

  // Sous-titre
  if (article.subtitle) {
    const h3 = document.createElement("h3");
    h3.textContent = article.subtitle;
    h3.classList.add("text-xl", "italic", "mb-2");
    div.appendChild(h3);
  }

  // Image principale
  if (article.mainImageUrl) {
    const img = document.createElement("img");
    img.src = article.mainImageUrl;
    img.alt = article.title;
    img.classList.add("w-full", "mb-4", "rounded");
    div.appendChild(img);
  }

  // Contenu
  const content = document.createElement("div");
  content.innerHTML = article.content; // ici le contenu peut inclure HTML, liens, <strong>, <em>, etc.
  content.classList.add("prose", "prose-lg", "mb-2");
  div.appendChild(content);

  // Tags
  if (article.tags && article.tags.length > 0) {
    const tagDiv = document.createElement("div");
    tagDiv.textContent = "Tags : " + article.tags.join(", ");
    tagDiv.classList.add("text-sm", "text-gray-600", "mt-2");
    div.appendChild(tagDiv);
  }

  return div;
}

// Charger les articles depuis Firestore
async function loadArticles() {
  try {
    const q = query(collection(db, "articles"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    articlesContainer.innerHTML = ""; // réinitialise
    querySnapshot.forEach(doc => {
      const article = doc.data();
      articlesContainer.appendChild(createArticleHTML(article));
    });
  } catch (err) {
    console.error("Erreur chargement articles : ", err);
  }
}

// Charger titre et intro depuis Firestore
async function loadBlogInfo() {
  try {
    const blogDoc = await getDocs(collection(db, "blogInfo"));
    blogDoc.forEach(doc => {
      const data = doc.data();
      blogTitle.textContent = data.title || "Mon Blog";
      blogSubtitle.textContent = data.subtitle || "Partagez vos idées avec le monde";
      blogIntro.textContent = data.intro || "Bienvenue sur mon blog !";
    });
  } catch (err) {
    console.error("Erreur chargement infos blog : ", err);
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  loadBlogInfo();
  loadArticles();
});
