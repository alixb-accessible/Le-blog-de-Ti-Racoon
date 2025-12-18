import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAf5L19V1ktK9wKGU87P30xNN9jde4-_Eg",
  authDomain: "page-admin-tiracoon-blog.firebaseapp.com",
  projectId: "page-admin-tiracoon-blog",
  storageBucket: "page-admin-tiracoon-blog.firebasestorage.app",
  messagingSenderId: "1091401553072",
  appId: "1:1091401553072:web:0ddc04b952de5ed1225775"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Éléments du DOM
const articlesContainer = document.getElementById("articles");
const loadingDiv = document.getElementById("loading");
const noArticlesDiv = document.getElementById("no-articles");
const blogTitle = document.getElementById("blog-title");
const blogSubtitle = document.getElementById("blog-subtitle");
const blogIntro = document.getElementById("blog-intro");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const tagsCloud = document.getElementById("tags-cloud");
const adminLink = document.getElementById("admin-link");

// Variables globales
let allArticles = [];
let allTags = new Set();

// Vérifier si l'utilisateur est connecté (pour afficher le lien admin)
onAuthStateChanged(auth, user => {
  if (user && adminLink) {
    adminLink.classList.remove('hidden');
  }
});

// Fonction pour créer un article HTML
function createArticleHTML(article) {
  const articleEl = document.createElement("article");
  articleEl.classList.add("content-overlay", "p-6", "rounded-lg", "shadow-md");
  
  // Titre principal de l'article (h2)
  const h2 = document.createElement("h2");
  h2.textContent = article.title;
  h2.classList.add("text-3xl", "font-bold", "mb-3", "text-gray-900");
  h2.tabIndex = 0; // Permet la navigation au clavier
  articleEl.appendChild(h2);
  
  // Sous-titre (si présent)
  if (article.subtitle) {
    const h3 = document.createElement("h3");
    h3.textContent = article.subtitle;
    h3.classList.add("text-xl", "italic", "mb-3", "text-gray-700");
    articleEl.appendChild(h3);
  }
  
  // Image principale avec alt text
  if (article.mainImageUrl) {
    const img = document.createElement("img");
    img.src = article.mainImageUrl;
    img.alt = article.mainImageAlt || article.title;
    img.classList.add("w-full", "max-w-2xl", "mb-4", "rounded", "shadow");
    img.loading = "lazy"; // Chargement différé pour les performances
    articleEl.appendChild(img);
  }
  
  // Contenu de l'article
  const contentDiv = document.createElement("div");
  contentDiv.innerHTML = article.content;
  contentDiv.classList.add("prose", "prose-lg", "max-w-none", "mb-4", "text-gray-800");
  articleEl.appendChild(contentDiv);
  
  // Tags
  if (article.tags && article.tags.length > 0) {
    const tagsDiv = document.createElement("div");
    tagsDiv.classList.add("flex", "flex-wrap", "gap-2", "mt-4");
    tagsDiv.setAttribute("aria-label", "Tags de l'article");
    
    article.tags.forEach(tag => {
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tag;
      tagSpan.classList.add(
        "px-3", "py-1", "bg-blue-100", "text-blue-800", 
        "rounded-full", "text-sm", "font-semibold"
      );
      tagSpan.setAttribute("role", "button");
      tagSpan.tabIndex = 0;
      tagSpan.addEventListener("click", () => filterByTag(tag));
      tagSpan.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          filterByTag(tag);
        }
      });
      tagsDiv.appendChild(tagSpan);
    });
    
    articleEl.appendChild(tagsDiv);
  }
  
  // Date de publication
  if (article.date) {
    const dateDiv = document.createElement("div");
    const dateObj = article.date.toDate ? article.date.toDate() : new Date(article.date);
    dateDiv.textContent = `Publié le ${dateObj.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    dateDiv.classList.add("text-sm", "text-gray-500", "mt-3");
    articleEl.appendChild(dateDiv);
  }
  
  return articleEl;
}

// Fonction pour charger les articles depuis Firestore
async function loadArticles() {
  try {
    loadingDiv.classList.remove("hidden");
    articlesContainer.innerHTML = "";
    noArticlesDiv.classList.add("hidden");
    
    const q = query(collection(db, "articles"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    
    allArticles = [];
    allTags.clear();
    
    querySnapshot.forEach(doc => {
      const article = doc.data();
      article.id = doc.id;
      allArticles.push(article);
      
      // Collecter tous les tags
      if (article.tags) {
        article.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    loadingDiv.classList.add("hidden");
    
    if (allArticles.length === 0) {
      noArticlesDiv.classList.remove("hidden");
    } else {
      displayArticles(allArticles);
      generateTagsCloud();
    }
    
  } catch (err) {
    console.error("Erreur chargement articles : ", err);
    loadingDiv.innerHTML = `<p class="text-red-600">Erreur lors du chargement des articles : ${err.message}</p>`;
  }
}

// Fonction pour afficher les articles
function displayArticles(articles) {
  articlesContainer.innerHTML = "";
  
  if (articles.length === 0) {
    noArticlesDiv.classList.remove("hidden");
    return;
  }
  
  noArticlesDiv.classList.add("hidden");
  articles.forEach(article => {
    articlesContainer.appendChild(createArticleHTML(article));
  });
}

// Fonction pour générer le nuage de tags
function generateTagsCloud() {
  tagsCloud.innerHTML = "";
  
  if (allTags.size === 0) {
    tagsCloud.innerHTML = '<p class="text-gray-500 text-sm">Aucun tag disponible</p>';
    return;
  }
  
  allTags.forEach(tag => {
    const tagButton = document.createElement("button");
    tagButton.textContent = tag;
    tagButton.classList.add(
      "px-3", "py-1", "bg-gray-200", "text-gray-800", 
      "rounded-full", "text-sm", "hover:bg-gray-300",
      "focus:outline-none", "focus:ring-2", "focus:ring-blue-500"
    );
    tagButton.addEventListener("click", () => filterByTag(tag));
    tagsCloud.appendChild(tagButton);
  });
}

// Fonction pour filtrer par tag
function filterByTag(tag) {
  const filtered = allArticles.filter(article => 
    article.tags && article.tags.includes(tag)
  );
  displayArticles(filtered);
  searchInput.value = ""; // Réinitialiser la recherche
}

// Fonction de recherche
function searchArticles(searchTerm) {
  const term = searchTerm.toLowerCase();
  const filtered = allArticles.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(term);
    const contentMatch = article.content.toLowerCase().includes(term);
    const tagsMatch = article.tags && article.tags.some(tag => 
      tag.toLowerCase().includes(term)
    );
    return titleMatch || contentMatch || tagsMatch;
  });
  displayArticles(filtered);
}

// Fonction de tri
function sortArticles(sortBy) {
  let sorted = [...allArticles];
  
  if (sortBy === "recent") {
    sorted.sort((a, b) => {
      const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
  } else if (sortBy === "oldest") {
    sorted.sort((a, b) => {
      const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    });
  }
  
  displayArticles(sorted);
}

// Fonction pour charger les infos du blog
async function loadBlogInfo() {
  try {
    const snapshot = await getDocs(collection(db, "blogInfo"));
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      blogTitle.textContent = data.title || "Ti Racoon Blog";
      blogSubtitle.textContent = data.subtitle || "Partagez vos idées avec le monde";
      blogIntro.textContent = data.intro || "Bienvenue sur mon blog !";
      
      // Mise à jour du titre de la page
      document.title = data.title || "Ti Racoon Blog";
    }
  } catch (err) {
    console.error("Erreur chargement infos blog : ", err);
  }
}

// Event listeners
searchInput.addEventListener("input", (e) => {
  searchArticles(e.target.value);
});

sortSelect.addEventListener("change", (e) => {
  sortArticles(e.target.value);
});

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  loadBlogInfo();
  loadArticles();
});
