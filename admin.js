import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, doc, getDocs, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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
const loginSection = document.getElementById("login-section");
const adminPanel = document.getElementById("admin-panel");
const statusDiv = document.getElementById("status");
const loginForm = document.getElementById("login-form");
const articleForm = document.getElementById("article-form");
const articlesList = document.getElementById("articles-list");

// Éléments pour les infos du blog
const blogTitleInput = document.getElementById("blog-title");
const blogSubtitleInput = document.getElementById("blog-subtitle");
const blogIntroInput = document.getElementById("blog-intro");
const saveBlogInfoBtn = document.getElementById("save-blog-info");

// Éléments pour l'éditeur
const articleContent = document.getElementById("article-content");

// Fonction pour afficher un message de statut
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.classList.remove("hidden", "bg-green-100", "text-green-800", "bg-red-100", "text-red-800");
  
  if (isError) {
    statusDiv.classList.add("bg-red-100", "text-red-800");
  } else {
    statusDiv.classList.add("bg-green-100", "text-green-800");
  }
  
  // Masquer automatiquement après 5 secondes
  setTimeout(() => {
    statusDiv.classList.add("hidden");
  }, 5000);
}

// Gestion de la connexion
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showStatus("Connexion réussie !");
  } catch (err) {
    showStatus("Erreur de connexion : " + err.message, true);
  }
});

// Vérifier l'état de connexion
onAuthStateChanged(auth, user => {
  if (user) {
    loginSection.style.display = "none";
    adminPanel.style.display = "block";
    loadArticles();
    loadBlogInfo();
  } else {
    loginSection.style.display = "block";
    adminPanel.style.display = "none";
  }
});

// Gestion de la barre d'outils de formatage
document.querySelectorAll(".editor-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const format = btn.dataset.format;
    insertFormat(format);
  });
});

// Fonction pour insérer du formatage dans le textarea
function insertFormat(format) {
  const start = articleContent.selectionStart;
  const end = articleContent.selectionEnd;
  const selectedText = articleContent.value.substring(start, end);
  const beforeText = articleContent.value.substring(0, start);
  const afterText = articleContent.value.substring(end);
  
  let insertedText = "";
  
  switch(format) {
    case "h2":
      insertedText = `<h2>${selectedText || "Titre de niveau 2"}</h2>`;
      break;
    case "h3":
      insertedText = `<h3>${selectedText || "Titre de niveau 3"}</h3>`;
      break;
    case "bold":
      insertedText = `<strong>${selectedText || "texte en gras"}</strong>`;
      break;
    case "italic":
      insertedText = `<em>${selectedText || "texte en italique"}</em>`;
      break;
    case "link":
      const url = prompt("URL du lien :", "https://");
      if (url) {
        insertedText = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText || "texte du lien"}</a>`;
      } else {
        return;
      }
      break;
    case "image":
      const imgUrl = prompt("URL de l'image :", "https://");
      const imgAlt = prompt("Description de l'image (alt text) :", "");
      if (imgUrl) {
        insertedText = `<img src="${imgUrl}" alt="${imgAlt}" class="w-full max-w-2xl rounded shadow my-4">`;
      } else {
        return;
      }
      break;
    case "ul":
      insertedText = `<ul>\n  <li>${selectedText || "élément 1"}</li>\n  <li>élément 2</li>\n  <li>élément 3</li>\n</ul>`;
      break;
    case "p":
      insertedText = `<p>${selectedText || "Votre paragraphe ici"}</p>`;
      break;
    default:
      return;
  }
  
  articleContent.value = beforeText + insertedText + afterText;
  articleContent.focus();
  
  // Positionner le curseur après le texte inséré
  const newPosition = start + insertedText.length;
  articleContent.setSelectionRange(newPosition, newPosition);
}

// Sauvegarder les infos du blog
saveBlogInfoBtn.addEventListener("click", async () => {
  try {
    const infoRef = collection(db, "blogInfo");
    const snapshot = await getDocs(infoRef);
    
    const data = {
      title: blogTitleInput.value,
      subtitle: blogSubtitleInput.value,
      intro: blogIntroInput.value
    };
    
    if (!snapshot.empty) {
      const docRef = doc(db, "blogInfo", snapshot.docs[0].id);
      await updateDoc(docRef, data);
    } else {
      await addDoc(infoRef, data);
    }
    
    showStatus("Informations du blog mises à jour !");
  } catch (err) {
    showStatus("Erreur lors de la sauvegarde : " + err.message, true);
  }
});

// Ajouter un article
articleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  try {
    const data = {
      title: document.getElementById("article-title").value,
      subtitle: document.getElementById("article-subtitle").value,
      content: document.getElementById("article-content").value,
      mainImageUrl: document.getElementById("article-image").value,
      mainImageAlt: document.getElementById("article-image-alt").value,
      tags: document.getElementById("article-tags").value
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0),
      date: Timestamp.now()
    };
    
    await addDoc(collection(db, "articles"), data);
    showStatus("Article publié avec succès !");
    articleForm.reset();
    loadArticles();
    
  } catch (err) {
    showStatus("Erreur lors de la publication : " + err.message, true);
  }
});

// Charger la liste des articles
async function loadArticles() {
  try {
    articlesList.innerHTML = "";
    const snapshot = await getDocs(collection(db, "articles"));
    
    if (snapshot.empty) {
      articlesList.innerHTML = '<p class="text-gray-500">Aucun article pour le moment.</p>';
      return;
    }
    
    snapshot.forEach(docSnap => {
      const article = docSnap.data();
      const div = document.createElement("div");
      div.classList.add("flex", "justify-between", "items-center", "p-3", "border", "rounded", "bg-gray-50");
      
      const titleSpan = document.createElement("span");
      titleSpan.textContent = article.title;
      titleSpan.classList.add("font-semibold");
      
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Supprimer";
      deleteBtn.classList.add(
        "px-3", "py-1", "bg-red-600", "text-white", "rounded", 
        "hover:bg-red-700", "focus:outline-none", "focus:ring-2", 
        "focus:ring-red-500", "focus:ring-offset-2"
      );
      deleteBtn.dataset.id = docSnap.id;
      
      deleteBtn.addEventListener("click", async () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'article "${article.title}" ?`)) {
          try {
            await deleteDoc(doc(db, "articles", docSnap.id));
            showStatus("Article supprimé.");
            loadArticles();
          } catch (err) {
            showStatus("Erreur lors de la suppression : " + err.message, true);
          }
        }
      });
      
      div.appendChild(titleSpan);
      div.appendChild(deleteBtn);
      articlesList.appendChild(div);
    });
    
  } catch (err) {
    showStatus("Erreur lors du chargement des articles : " + err.message, true);
  }
}

// Charger les infos du blog dans les champs
async function loadBlogInfo() {
  try {
    const snapshot = await getDocs(collection(db, "blogInfo"));
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      blogTitleInput.value = data.title || "";
      blogSubtitleInput.value = data.subtitle || "";
      blogIntroInput.value = data.intro || "";
    }
  } catch (err) {
    console.error("Erreur chargement infos blog : ", err);
  }
}
