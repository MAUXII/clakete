'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, 'Username deve ter no mínimo 2 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e _')
    .transform(val => val.toLowerCase()),
  avatar_url: z.string().max(160,'URL inválida').optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useSupabaseClient()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      avatar_url: '',
    },
  })

  async function onSubmit(values: ProfileFormValues) {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não encontrado')

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: values.username,
          email: user.email!,
          avatar_url: values.avatar_url! || null,
        })
        .select()
        .single()

      if (userError) throw userError



      onClose()
      router.push(`/${values.username}`)
      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete seu perfil </DialogTitle>
          <DialogDescription>
            Adicione algumas informações para personalizar seu perfil
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="seu_username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar perfil'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 