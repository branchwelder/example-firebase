import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithRedirect,
  onAuthStateChanged,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { html, render } from "lit-html";

const firebaseConfig = {
  apiKey: "AIzaSyDZ3kBP1nUuSbT98r2_UkIZTfC5OXdwru0",
  authDomain: "hcde438-example.firebaseapp.com",
  projectId: "hcde438-example",
  storageBucket: "hcde438-example.appspot.com",
  messagingSenderId: "430697304934",
  appId: "1:430697304934:web:e2f1c89477c18c8e50aea7",
};

let messages = [];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);
const messagesRef = collection(db, "messages");

// Setup Google authentication
const provider = new GoogleAuthProvider();

// This function is called if the Sign In button is clicked
function signInUser() {
  signInWithRedirect(auth, provider);
}

// This function is called if the Sign Out button is clicked
function signOutUser() {
  signOut(auth)
    .then(() => {
      console.info("Sign out was successful");
    })
    .catch((error) => {
      console.error(`Error ${error.code}: ${error.message}.`);
    });
}

// This function returns a template with the sign in view - what the user sees when they're signed out
function signInView() {
  return html`<button class="sign-in" @click=${signInUser}>
    Sign in with Google
  </button>`;
}

// This function returns a template with normal app view - what the user sees when they're signed in
function view() {
  let user = auth.currentUser;
  return html`
    <div id="top-bar">
      <span>chit chat</span>
      <span>Signed in as ${auth.currentUser.displayName}</span>
      <button @click=${signOutUser}>Sign Out</button>
    </div>
    <div id="messages-container">
      ${messages.map(
        (msg) => html`<div
          class="message ${msg.uid == user.uid ? "right" : "left"}">
          <div class="message-content">${msg.content}</div>
          <div class="message-info">${msg.displayName}</div>
        </div>`
      )}
    </div>
    <div id="message-composer">
      <input
        id="message-entry"
        @keydown=${type}
        type="text"
        placeholder="type here..." />
    </div>
  `;
}

// This is an observer which runs whenever the authentication state is changed
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("AUTH STATE CHANGED");
    const uid = user.uid;
    console.log(user);
    // If there is an authenticated user, we render the normal view
    render(view(), document.body);
    getAllMessages();
  } else {
    // Otherwise, we render the sign in view
    render(signInView(), document.body);
  }
});

async function sendMessage(message) {
  console.log("Sending a message!");
  const user = auth.currentUser;
  // Add some data to the users collection
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      displayName: user.displayName,
      uid: user.uid,
      time: Date.now(),
      content: message,
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

async function getAllMessages() {
  messages = [];

  const querySnapshot = await getDocs(
    query(messagesRef, orderBy("time", "desc"))
  );
  querySnapshot.forEach((doc) => {
    let msgData = doc.data();
    messages.push(msgData);
  });
  render(view(), document.body);
}

onSnapshot(
  collection(db, "messages"),
  (snapshot) => {
    console.log("snap", snapshot);
    getAllMessages();
  },
  (error) => {
    console.error(error);
  }
);

function type(e) {
  if (e.key == "Enter") {
    sendMessage(e.target.value);
    e.target.value = "";
  }
}
