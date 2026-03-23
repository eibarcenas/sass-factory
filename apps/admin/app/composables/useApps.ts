import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { useFirestore, useCollection } from 'vuefire'
import type { AppConfig } from '@sass-factory/core'
import { COLLECTIONS } from '@sass-factory/core'

export function useApps() {
  const db = useFirestore()
  const appsRef = collection(db, COLLECTIONS.APPS)

  const apps = useCollection<AppConfig>(appsRef)

  async function createApp(data: Omit<AppConfig, 'id' | 'createdAt' | 'updatedAt'>) {
    return addDoc(appsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function updateApp(id: string, data: Partial<AppConfig>) {
    return updateDoc(doc(appsRef, id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteApp(id: string) {
    return deleteDoc(doc(appsRef, id))
  }

  return { apps, createApp, updateApp, deleteApp }
}
