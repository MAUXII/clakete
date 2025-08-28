'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"

const editProfileSchema = z.object({
  avatar_url: z.string().url('URL inválida').optional(),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional(),
})

type EditProfileValues = z.infer<typeof editProfileSchema>

interface EditProfileButtonProps {
  initialData: {
    avatar_url?: string | null
    bio?: string | null
  }
  userId: string
}

export function EditProfileButton({ initialData, userId }: EditProfileButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useSupabaseClient()

  const form = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      avatar_url: initialData.avatar_url || '',
      bio: initialData.bio || '',
    },
  })

  async function onSubmit(values: EditProfileValues) {
    try {
      setLoading(true)

      // Atualiza o avatar_url na tabela users
      const { error: userError } = await supabase
        .from('users')
        .update({ avatar_url: values.avatar_url || null })
        .eq('id', userId)

      if (userError) throw userError

      // Atualiza a bio na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ bio: values.bio || null })
        .eq('user_id', userId)

      if (profileError) throw profileError

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Editar perfil</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editssar perfil</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da foto de perfidsdsdl</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/foto.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conte um pouco sobre você..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 