'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e _'),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional(),
  avatar_url: z.string().url('URL inválida').optional(),
})

export default function ProfileSetup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = useSupabaseClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      bio: '',
      avatar_url: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Usuário não encontrado')

      // Atualiza o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: values.username,
          bio: values.bio,
          avatar_url: values.avatar_url,
        })

      if (profileError) throw profileError

      // Redireciona para a home
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete seu perfil</CardTitle>
          <CardDescription>
            Adicione algumas informações para personalizar seu perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da foto de perfil</FormLabel>
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
                {loading ? 'Salvando...' : 'Salvar perfil'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 