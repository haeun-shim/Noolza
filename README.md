# 모아요 — 배포 가이드

## 1단계: Firebase 설정 (무료)

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" → 이름 입력 (예: moayo-app)
3. 왼쪽 메뉴 → **Realtime Database** → "데이터베이스 만들기"
   - 위치: asia-southeast1 (싱가포르, 한국에서 빠름)
   - 보안 규칙: **테스트 모드로 시작** 선택
4. 왼쪽 메뉴 → **프로젝트 설정** (톱니바퀴 아이콘)
   - "앱 추가" → 웹 (</>)
   - 앱 닉네임: moayo
   - **firebaseConfig 복사**

## 2단계: 코드에 설정 붙여넣기

`src/firebase.js` 파일을 열어서 firebaseConfig 값 교체:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "moayo-app.firebaseapp.com",
  databaseURL: "https://moayo-app-default-rtdb.asia-southeast1.firebasedatabase.app",  // ← 이게 핵심!
  projectId: "moayo-app",
  storageBucket: "moayo-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123",
}
```

⚠️ **databaseURL**이 없으면 작동 안 해요! Realtime Database 탭에서 URL 확인하세요.

## 3단계: Vercel 배포 (무료, 가장 쉬움)

### 방법 A: GitHub 없이 바로 배포
```bash
npm install -g vercel
cd moayo
npm install
vercel
```
→ 이메일로 로그인 → 질문에 전부 Enter → 완료!

### 방법 B: GitHub 연동
1. GitHub에 이 폴더 push
2. https://vercel.com → "Import Project" → GitHub 레포 선택
3. 자동 배포 완료

## 4단계: Firebase 보안 규칙 설정 (선택, 권장)

Firebase Console → Realtime Database → 규칙 탭:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## 완료!

배포된 URL을 친구들에게 공유하면 끝이에요.
로그인 없이 누구나 방 코드로 참여할 수 있어요. 🎉
