import { redirect } from "next/navigation";

export default function StudentLibraryRedirectPage() {
  redirect("/student/books");
}
