<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyAf5L19V1ktK9wKGU87P30xNN9jde4-_Eg",
    authDomain: "page-admin-tiracoon-blog.firebaseapp.com",
    projectId: "page-admin-tiracoon-blog",
    storageBucket: "page-admin-tiracoon-blog.firebasestorage.app",
    messagingSenderId: "1091401553072",
    appId: "1:1091401553072:web:0ddc04b952de5ed1225775"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const titleEl = document.getElementById("blogTitle");
  const subtitleEl = document.getElementById("blogSubtitle");
  const presentationEl = document.getElementById("blogPresentation");
  const articlesContainer = document.getElementById("articlesContainer");

  const loadBlogContent = async () => {
    // Charger titre, sous-titre et présentation
    const blogCol = collection(db, "blog");
    const blogSnap = await getDocs(blogCol);
    blogSnap.forEach(doc => {
      const data = doc.data();
      if (data.title) titleEl.textContent = data.title;
      if (data.subtitle) subtitleEl.textContent = data.subtitle;
      if (data.presentation) presentationEl.textContent = data.presentation;
    });

    // Charger articles
    const articlesCol = collection(db, "articles");
    const q = query(articlesCol, orderBy("createdAt", "desc"));
    const articlesSnap = await getDocs(q);

    articlesContainer.innerHTML = "";
    articlesSnap.forEach(doc => {
      const data = doc.data();
      const articleDiv = document.createElement("div");
      articleDiv.className = "border rounded p-4 mb-4";

      // Titre article
      const h2 = document.createElement("h2");
      h2.className = "text-xl font-bold mb-2";
      h2.textContent = data.title;
      articleDiv.appendChild(h2);

      // Image principale
      if (data.image) {
        const img = document.createElement("img");
        img.src = data.image;
        img.alt = data.title;
        img.className = "mb-2 w-full h-auto rounded";
        articleDiv.appendChild(img);
      }

      // Contenu HTML
      const contentDiv = document.createElement("div");
      contentDiv.innerHTML = data.content || "";
      articleDiv.appendChild(contentDiv);

      articlesContainer.appendChild(articleDiv);
    });
  };

  loadBlogContent();
</script>
