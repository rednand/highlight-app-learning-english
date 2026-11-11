"use client"

import { useActionState } from "react"
import { deleteAccount, type DeleteAccountResult } from "../../actions/account"

export default function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteAccountResult | null, FormData>(
    deleteAccount,
    null,
  )

  return (
    <form action={action} className="space-y-3">
      <label htmlFor="confirmation" className="block text-sm text-gray-400">
        Para confirmar, digite <span className="font-bold text-white">EXCLUIR</span>
      </label>
      <input
        id="confirmation"
        name="confirmation"
        type="text"
        autoComplete="off"
        required
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500"
      />
      {state?.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
      >
        {pending ? "Excluindo..." : "Excluir minha conta"}
      </button>
    </form>
  )
}
