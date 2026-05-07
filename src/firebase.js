// ⚠️ 아래 값들을 Firebase 콘솔에서 복사한 본인 설정으로 교체하세요!
// Firebase Console → 프로젝트 설정 → 앱 → firebaseConfig

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBiL7AnKuaQVM64TCVWHU8tGmK72ibqBsY",
  authDomain: "noolza-47dc2.firebaseapp.com",
  databaseURL: "https://noolza-47dc2-default-rtdb.firebaseio.com",
  projectId: "noolza-47dc2",
  storageBucket: "noolza-47dc2.firebasestorage.app",
  messagingSenderId: "64132698864",
  appId: "1:64132698864:web:089349dfa91c1c36dfa835",
  measurementId: "G-Q778C1MX8J"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
