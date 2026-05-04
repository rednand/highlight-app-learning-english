// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./utils/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createLesson(formData: FormData) {
  const supabase = await createClient();

  // Verifica o usuário
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("Erro de Autenticação:", authError);
    redirect("/login?message=session-expired");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Realiza o insert
  const { data, error } = await supabase
    .from("lessons")
    .insert([
      {
        title,
        content,
        user_id: user.id
      }
    ])
    .select() // IMPORTANTE: Garante que o Supabase retorne os dados inseridos
    .single();



  revalidatePath("/dashboard");

  // Agora 'data.id' está garantido
  redirect(`/dashboard/lessons/${data.id}`);
}