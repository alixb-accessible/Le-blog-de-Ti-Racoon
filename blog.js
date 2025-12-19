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
const articlesGrid = document.getElementById("articles-grid");
const loadingDiv = document.getElementById("loading");
const noArticlesDiv = document.getElementById("no-articles");
const blogTitle = document.getElementById("blog-title");
const blogSubtitle = document.getElementById("blog-subtitle");
const blogIntro = document.getElementById("blog-intro");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const tagsCloud = document.getElementById("tags-cloud");
const categoriesList = document.getElementById("categories-list");
const adminLink = document.querySelector('a[href="admin.html"]');
const resetFiltersBtn = document.getElementById("reset-filters");
const currentFilterDiv = document.getElementById("current-filter");

// Modal
const modal = document.getElementById("article-modal");
const modalBody = document.getElementById("modal-body");
const closeModalBtn = document.querySelector(".close-modal");

// Variables globales
let allArticles = [];
let allTags = new Set();
let allCategories = new Set();
let currentCategory = null;
let currentTag = null;

// Vérifier si l'utilisateur est connecté (pour afficher le lien admin)
onAuthStateChanged(auth, user => {
  if (user && adminLink) {
    adminLink.classList.remove('hidden');
  }
});

// Fonction pour extraire un extrait du contenu HTML
function getExcerpt(htmlContent, maxLength = 150) {
  const div = document.createElement('div');
  div.innerHTML = htmlContent;
  const text = div.textContent || div.innerText || '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Fonction pour créer une carte d'article
function createArticleCard(article) {
  const card = document.createElement("article");
  card.classList.add("article-card", "content-overlay", "rounded-lg", "shadow-md", "overflow-hidden", "cursor-pointer");
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Lire l'article : ${article.title}`);
  
  // Image
  if (article.mainImageUrl) {
    const img = document.createElement("img");
    img.src = article.mainImageUrl;
    img.alt = article.mainImageAlt || article.title;
    img.loading = "lazy";
    card.appendChild(img);
  } else {
    // Image par défaut si pas d'image
    const placeholder = document.createElement("div");
    placeholder.classList.add("bg-gradient-to-br", "from-blue-400", "to-purple-500", "flex", "items-center", "justify-center");
    placeholder.style.height = "200px";
    const placeholderText = document.createElement("span");
    placeholderText.textContent = article.title.charAt(0).toUpperCase();
    placeholderText.classList.add("text-6xl", "font-bold", "text-white");
    placeholder.appendChild(placeholderText);
    card.appendChild(placeholder);
  }
  
  // Contenu de la carte
  const content = document.createElement("div");
  content.classList.add("p-4", "flex", "flex-col", "flex-grow");
  
  // Catégorie
  if (article.category) {
    const categoryBadge = document.createElement("span");
    categoryBadge.textContent = article.category;
    categoryBadge.classList.add("inline-block", "px-3", "py-1", "bg-blue-100", "text-blue-800", "rounded-full", "text-xs", "font-semibold", "mb-2", "self-start");
    content.appendChild(categoryBadge);
  }
  
  // Titre
  const title = document.createElement("h3");
  title.textContent = article.title;
  title.classList.add("text-xl", "font-bold", "mb-2", "text-gray-900");
  content.appendChild(title);
  
  // Sous-titre
  if (article.subtitle) {
    const subtitle = document.createElement("p");
    subtitle.textContent = article.subtitle;
    subtitle.classList.add("text-sm", "italic", "text-gray-600", "mb-2");
    content.appendChild(subtitle);
  }
  
  // Extrait
  const excerpt = document.createElement("p");
  excerpt.textContent = getExcerpt(article.content);
  excerpt.classList.add("text-gray-700", "mb-4", "flex-grow");
  content.appendChild(excerpt);
  
  // Date
  if (article.date) {
    const dateDiv = document.createElement("div");
    const dateObj = article.date.toDate ? article.date.toDate() : new Date(article.date);
    dateDiv.textContent = dateObj.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    dateDiv.classList.add("text-xs", "text-gray-500", "mb-3");
    content.appendChild(dateDiv);
  }
  
  // Bouton lire la suite
  const readMoreBtn = document.createElement("button");
  readMoreBtn.textContent = "Lire l'article";
  readMoreBtn.classList.add("px-4", "py-2", "bg-blue-600", "text-white", "rounded", "hover:bg-blue-700", "focus:outline-none", "focus:ring-2", "focus:ring-blue-500", "self-start");
  content.appendChild(readMoreBtn);
  
  card.appendChild(content);
  
  // Event listeners pour ouvrir la modale
  const openModal = () => showArticleModal(article);
  card.addEventListener("click", openModal);
  card.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal();
    }
  });
  
  return card;
}

// Fonction pour afficher l'article dans une modale
function showArticleModal(article) {
  modalBody.innerHTML = "";
  
  // Titre
  const title = document.createElement("h2");
  title.id = "modal-title";
  title.textContent = article.title;
  title.classList.add("text-3xl", "font-bold", "mb-3", "text-gray-900", "mt-8");
  modalBody.appendChild(title);
  
  // Sous-titre
  if (article.subtitle) {
    const subtitle = document.createElement("h3");
    subtitle.textContent = article.subtitle;
    subtitle.classList.add("text-xl", "italic", "mb-3", "text-gray-700");
    modalBody.appendChild(subtitle);
  }
  
  // Catégorie
  if (article.category) {
    const categoryBadge = document.createElement("span");
    categoryBadge.textContent = article.category;
    categoryBadge.classList.add("inline-block", "px-3", "py-1", "bg-blue-100", "text-blue-800", "rounded-full", "text-sm", "font-semibold", "mb-4");
    modalBody.appendChild(categoryBadge);
  }
  
  // Image
  if (article.mainImageUrl) {
    const img = document.createElement("img");
    img.src = article.mainImageUrl;
    img.alt = article.mainImageAlt || article.title;
    img.classList.add("w-full", "max-w-2xl", "mb-4", "rounded", "shadow");
    modalBody.appendChild(img);
  }
  
  // Contenu
  const content = document.createElement("div");
  content.innerHTML = article.content;
  content.classList.add("prose", "prose-lg", "max-w-none", "mb-4", "text-gray-800");
  modalBody.appendChild(content);
  
  // Tags
  if (article.tags && article.tags.length > 0) {
    const tagsDiv = document.createElement("div");
    tagsDiv.classList.add("flex", "flex-wrap", "gap-2", "mt-6", "pt-4", "border-t");
    
    const tagsLabel = document.createElement("span");
    tagsLabel.textContent = "Tags : ";
    tagsLabel.classList.add("font-semibold", "text-gray-700");
    tagsDiv.appendChild(tagsLabel);
    
    article.tags.forEach(tag => {
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tag;
      tagSpan.classList.add("px-3", "py-1", "bg-gray-200", "text-gray-800", "rounded-full", "text-sm");
      tagsDiv.appendChild(tagSpan);
    });
    
    modalBody.appendChild(tagsDiv);
  }
  
  // Date
  if (article.date) {
    const dateDiv = document.createElement("div");
    const dateObj = article.date.toDate ? article.date.toDate() : new Date(article.date);
    dateDiv.textContent = `Publié le ${dateObj.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    dateDiv.classList.add("text-sm", "text-gray-500", "mt-4", "italic");
    modalBody.appendChild(dateDiv);
  }
  
  modal.classList.add("active");
  closeModalBtn.focus();
}

// Fermer la modale
closeModalBtn.addEventListener("click", () => {
  modal.classList.remove("active");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

// Fermer avec Échap
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("active")) {
    modal.classList.remove("active");
  }
});

// Fonction pour charger les articles depuis Firestore
async function loadArticles() {
  try {
    loadingDiv.classList.remove("hidden");
    articlesGrid.innerHTML = "";
    noArticlesDiv.classList.add("hidden");
    
    const q = query(collection(db, "articles"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    
    allArticles = [];
    allTags.clear();
    allCategories.clear();
    
    querySnapshot.forEach(doc => {
      const article = doc.data();
      article.id = doc.id;
      
      // Assigner catégorie par défaut si elle n'existe pas
      if (!article.category) {
        article.category = "notes";
      }
      
      allArticles.push(article);
      
      // Collecter les tags
      if (article.tags) {
        article.tags.forEach(tag => allTags.add(tag));
      }
      
      // Collecter les catégories
      if (article.category) {
        allCategories.add(article.category);
      }
    });
    
    loadingDiv.classList.add("hidden");
    
    if (allArticles.length === 0) {
      noArticlesDiv.classList.remove("hidden");
    } else {
      displayArticles(allArticles);
      generateTagsCloud();
      generateCategoriesList();
    }
    
  } catch (err) {
    console.error("Erreur chargement articles : ", err);
    loadingDiv.innerHTML = `<p class="text-red-600">Erreur lors du chargement des articles : ${err.message}</p>`;
  }
}

// Fonction pour afficher les articles
function displayArticles(articles) {
  articlesGrid.innerHTML = "";
  
  if (articles.length === 0) {
    noArticlesDiv.classList.remove("hidden");
    return;
  }
  
  noArticlesDiv.classList.add("hidden");
  articles.forEach(article => {
    articlesGrid.appendChild(createArticleCard(article));
  });
}

// Fonction pour générer la liste des catégories
function generateCategoriesList() {
  categoriesList.innerHTML = "";
  
  // Bouton "Toutes"
  const allBtn = document.createElement("button");
  allBtn.textContent = "Toutes";
  allBtn.classList.add("category-btn", "px-4", "py-2", "bg-gray-200", "text-gray-800", "rounded-full", "font-semibold", "hover:bg-gray-300", "focus:outline-none", "focus:ring-2", "focus:ring-blue-500", "active");
  allBtn.addEventListener("click", () => {
    currentCategory = null;
    updateFilters();
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    allBtn.classList.add("active");
  });
  categoriesList.appendChild(allBtn);
  
  // Boutons des catégories
  allCategories.forEach(category => {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.classList.add("category-btn", "px-4", "py-2", "bg-gray-200", "text-gray-800", "rounded-full", "font-semibold", "hover:bg-gray-300", "focus:outline-none", "focus:ring-2", "focus:ring-blue-500");
    btn.addEventListener("click", () => {
      currentCategory = category;
      updateFilters();
      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
    categoriesList.appendChild(btn);
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
    tagButton.classList.add("px-3", "py-1", "bg-gray-200", "text-gray-800", "rounded-full", "text-sm", "hover:bg-gray-300", "focus:outline-none", "focus:ring-2", "focus:ring-blue-500");
    tagButton.addEventListener("click", () => {
      currentTag = tag;
      updateFilters();
    });
    tagsCloud.appendChild(tagButton);
  });
}

// Fonction pour mettre à jour les filtres
function updateFilters() {
  let filtered = [...allArticles];
  let filterText = "";
  
  // Filtre par catégorie
  if (currentCategory) {
    filtered = filtered.filter(article => article.category === currentCategory);
    filterText += `Catégorie: ${currentCategory}`;
  }
  
  // Filtre par tag
  if (currentTag) {
    filtered = filtered.filter(article => article.tags && article.tags.includes(currentTag));
    if (filterText) filterText += " | ";
    filterText += `Tag: ${currentTag}`;
  }
  
  // Filtre par recherche
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(searchTerm);
      const contentMatch = article.content.toLowerCase().includes(searchTerm);
      const tagsMatch = article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      return titleMatch || contentMatch || tagsMatch;
    });
    if (filterText) filterText += " | ";
    filterText += `Recherche: "${searchTerm}"`;
  }
  
  // Afficher le filtre actif
  if (filterText) {
    currentFilterDiv.classList.remove("hidden");
    currentFilterDiv.querySelector("p").textContent = `Filtres actifs: ${filterText}`;
  } else {
    currentFilterDiv.classList.add("hidden");
  }
  
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
  
  allArticles = sorted;
  updateFilters();
}

// Fonction pour charger les infos du blog
async function loadBlogInfo() {
  try {
    const snapshot = await getDocs(collection(db, "blogInfo"));
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      blogTitle.textContent = data.title || "Le blog de Ti Racoon";
      blogSubtitle.textContent = data.subtitle || "Partagez vos idées avec le monde";
      blogIntro.textContent = data.intro || "Bienvenue sur mon blog !";
      document.title = data.title || "Le blog de Ti Racoon";
    }
  } catch (err) {
    console.error("Erreur chargement infos blog : ", err);
  }
}

// Event listeners
searchInput.addEventListener("input", () => {
  currentTag = null;
  updateFilters();
});

sortSelect.addEventListener("change", (e) => {
  sortArticles(e.target.value);
});

resetFiltersBtn.addEventListener("click", () => {
  currentCategory = null;
  currentTag = null;
  searchInput.value = "";
  document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelector(".category-btn").classList.add("active");
  updateFilters();
});

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  loadBlogInfo();
  loadArticles();
});
