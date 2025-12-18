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
const logoutBtn = document.getElementById("logout-btn");

// Éléments pour les infos du blog
const blogTitleInput = document.getElementById("blog-title");
const blogSubtitleInput = document.getElementById("blog-subtitle");
const blogIntroInput = document.getElementById("blog-intro");
const saveBlogInfoBtn = document.getElementById("save-blog-info");

// Initialisation de l'éditeur Quill
let quill;
window.addEventListener('DOMContentLoaded', () => {
  quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Écrivez votre article ici...',
    modules: {
      toolbar: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        ['link', 'image'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
      ]
    }
  });
});

// Fonction pour afficher un message de statut
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.classList.remove("hidden", "status-success", "status-error");
  
  if (isError) {
    statusDiv.classList.add("status-error");
  } else {
    statusDiv.classList.add("status-success");
  }
  
  // Masquer automatiquement après 5 secondes
  setTimeout(() => {
    statusDiv.classList.add("hidden");
  }, 5000);
  
  // Scroll vers le haut pour voir le message
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Gestion de la connexion
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showStatus("✓ Connexion réussie ! Bienvenue.");
  } catch (err) {
    console.error("Erreur connexion:", err);
    let errorMsg = "Erreur de connexion. ";
    if (err.code === "auth/invalid-credential") {
      errorMsg += "Email ou mot de passe incorrect.";
    } else if (err.code === "auth/user-not-found") {
      errorMsg += "Aucun compte trouvé avec cet email.";
    } else if (err.code === "auth/wrong-password") {
      errorMsg += "Mot de passe incorrect.";
    } else {
      errorMsg += err.message;
    }
    showStatus(errorMsg, true);
  }
});

// Gestion de la déconnexion
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showStatus("✓ Déconnexion réussie.");
  } catch (err) {
    showStatus("Erreur lors de la déconnexion : " + err.message, true);
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

// Sauvegarder les infos du blog
saveBlogInfoBtn.addEventListener("click", async () => {
  try {
    const infoRef = collection(db, "blogInfo");
    const snapshot = await getDocs(infoRef);
    
    const data = {
      title: blogTitleInput.value.trim(),
      subtitle: blogSubtitleInput.value.trim(),
      intro: blogIntroInput.value.trim()
    };
    
    if (!data.title) {
      showStatus("⚠ Le titre du blog ne peut pas être vide.", true);
      return;
    }
    
    if (!snapshot.empty) {
      const docRef = doc(db, "blogInfo", snapshot.docs[0].id);
      await updateDoc(docRef, data);
    } else {
      await addDoc(infoRef, data);
    }
    
    showStatus("✓ Informations du blog mises à jour avec succès !");
  } catch (err) {
    console.error("Erreur sauvegarde blog info:", err);
    showStatus("❌ Erreur lors de la sauvegarde : " + err.message, true);
  }
});

// Ajouter un article
articleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  try {
    // Récupérer le contenu HTML de l'éditeur Quill
    const content = quill.root.innerHTML;
    
    // Validation
    const title = document.getElementById("article-title").value.trim();
    if (!title) {
      showStatus("⚠ Le titre de l'article est obligatoire.", true);
      return;
    }
    
    if (content === '<p><br></p>' || content.trim() === '') {
      showStatus("⚠ Le contenu de l'article ne peut pas être vide.", true);
      return;
    }
    
    const data = {
      title: title,
      subtitle: document.getElementById("article-subtitle").value.trim(),
      content: content,
      mainImageUrl: document.getElementById("article-image").value.trim(),
      mainImageAlt: document.getElementById("article-image-alt").value.trim(),
      tags: document.getElementById("article-tags").value
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0),
      date: Timestamp.now()
    };
    
    await addDoc(collection(db, "articles"), data);
    showStatus("✓ Article publié avec succès !");
    
    // Réinitialiser le formulaire
    articleForm.reset();
    quill.setContents([]);
    
    loadArticles();
    
  } catch (err) {
    console.error("Erreur publication article:", err);
    showStatus("❌ Erreur lors de la publication : " + err.message, true);
  }
});

// Charger la liste des articles
async function loadArticles() {
  try {
    articlesList.innerHTML = '<p class="text-gray-500">Chargement des articles...</p>';
    const snapshot = await getDocs(collection(db, "articles"));
    
    if (snapshot.empty) {
      articlesList.innerHTML = '<p class="text-gray-500">Aucun article pour le moment. Créez-en un !</p>';
      return;
    }
    
    articlesList.innerHTML = "";
    
    snapshot.forEach(docSnap => {
      const article = docSnap.data();
      const div = document.createElement("div");
      div.classList.add("flex", "justify-between", "items-center", "p-4", "border", "rounded", "bg-gray-50", "hover:bg-gray-100");
      
      const infoDiv = document.createElement("div");
      
      const titleSpan = document.createElement("span");
      titleSpan.textContent = article.title;
      titleSpan.classList.add("font-semibold", "text-lg", "block", "mb-1");
      
      const dateSpan = document.createElement("span");
      if (article.date) {
        const dateObj = article.date.toDate ? article.date.toDate() : new Date(article.date);
        dateSpan.textContent = dateObj.toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      dateSpan.classList.add("text-sm", "text-gray-500");
      
      infoDiv.appendChild(titleSpan);
      infoDiv.appendChild(dateSpan);
      
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Supprimer";
      deleteBtn.classList.add(
        "px-4", "py-2", "bg-red-600", "text-white", "rounded", 
        "hover:bg-red-700", "focus:outline-none", "focus:ring-2", 
        "focus:ring-red-500", "focus:ring-offset-2"
      );
      deleteBtn.dataset.id = docSnap.id;
      deleteBtn.dataset.title = article.title;
      
      deleteBtn.addEventListener("click", async () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'article "${article.title}" ?\n\nCette action est irréversible.`)) {
          try {
            await deleteDoc(doc(db, "articles", docSnap.id));
            showStatus("✓ Article supprimé.");
            loadArticles();
          } catch (err) {
            console.error("Erreur suppression:", err);
            showStatus("❌ Erreur lors de la suppression : " + err.message, true);
          }
        }
      });
      
      div.appendChild(infoDiv);
      div.appendChild(deleteBtn);
      articlesList.appendChild(div);
    });
    
  } catch (err) {
    console.error("Erreur chargement articles:", err);
    articlesList.innerHTML = `<p class="text-red-600">Erreur lors du chargement : ${err.message}</p>`;
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
    console.error("Erreur chargement infos blog:", err);
  }
}
