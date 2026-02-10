import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'

export async function register(email: string, password: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password)
  return res.user
}

export async function login(email: string, password: string) {
  const res = await signInWithEmailAndPassword(auth, email, password)
  return res.user
}
