import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import { db } from './firebase'
import type { FormState } from './App'

export type SavedFormDB = {
  id: string
  userId: string
  nombrePaciente: string
  domicilio: string
  data: Partial<FormState>
  updatedAt: string | Timestamp
  createdAt: string | Timestamp
}

const FORMS_COLLECTION = 'formularios'

/**
 * Save or update a form in Firestore
 */
export const saveFormToDatabase = async (
  userId: string,
  nombrePaciente: string,
  domicilio: string,
  formData: Partial<FormState>,
) => {
  try {
    // Check if form exists
    const q = query(
      collection(db, FORMS_COLLECTION),
      where('userId', '==', userId),
      where('nombrePaciente', '==', nombrePaciente),
      where('domicilio', '==', domicilio),
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Create new form
      const docRef = await addDoc(collection(db, FORMS_COLLECTION), {
        userId,
        nombrePaciente,
        domicilio,
        data: formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    } else {
      // Update existing form
      const existingDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, FORMS_COLLECTION, existingDoc.id), {
        data: formData,
        updatedAt: serverTimestamp(),
      })
      return existingDoc.id
    }
  } catch (error) {
    console.error('Error saving form to database:', error)
    throw error
  }
}

/**
 * Load all forms for a user from Firestore
 */
export const loadUserForms = async (userId: string): Promise<SavedFormDB[]> => {
  try {
    const q = query(collection(db, FORMS_COLLECTION), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)

    const forms = querySnapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as DocumentData

        return {
          id: docSnapshot.id,
          userId: String(data.userId ?? ''),
          nombrePaciente: String(data.nombrePaciente ?? ''),
          domicilio: String(data.domicilio ?? ''),
          data: (data.data ?? {}) as Partial<FormState>,
          updatedAt: data.updatedAt ?? '',
          createdAt: data.createdAt ?? '',
        } satisfies SavedFormDB
      })
      .sort((a, b) => {
        const timeA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0
        const timeB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0
        return timeB - timeA
      })

    return forms
  } catch (error) {
    console.error('Error loading forms from database:', error)
    throw error
  }
}

/**
 * Delete a form from Firestore
 */
export const deleteFormFromDatabase = async (formId: string) => {
  try {
    await deleteDoc(doc(db, FORMS_COLLECTION, formId))
  } catch (error) {
    console.error('Error deleting form from database:', error)
    throw error
  }
}

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string | Timestamp): string => {
  if (typeof timestamp === 'string') {
    return timestamp
  }
  if (timestamp instanceof Timestamp) {
    return new Date(timestamp.toMillis()).toLocaleString()
  }
  return ''
}
