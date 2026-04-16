import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  await addDoc(collection(db, "notifications"), {
    userId,
    title,
    message,
    read: false,
    link: link || null,
    createdAt: new Date(),
  });
}
