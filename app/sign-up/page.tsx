'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRive } from '@rive-app/react-canvas'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ProfileDialog } from '@/components/auth/profile-dialog'
import { AuthClaketeWordmark } from '@/components/auth/auth-clakete-wordmark'
import { AuthGoogleIcon } from '@/components/auth/auth-google-icon'
import { AuthMarketingPanel } from '@/components/auth/auth-marketing-panel'
import { userProfilePath } from '@/lib/list-href'

const formSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function SignUp() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const supabase = useSupabaseClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { rive, RiveComponent } = useRive({
    src: '/cat_password.riv',
    artboard: 'Main',
    stateMachines: ['PasswordStates'],
    autoplay: true,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  const handlePasswordChange = () => {
    if (!rive) return
    const stateMachine = rive.stateMachineInputs('PasswordStates')
    const input = stateMachine?.find((i) => i.name === 'passwordTyping')
    input?.fire()
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      })

      if (error) throw error

      toast.success('Account created!', {
        description: 'Choose your username to continue.',
      })
      setShowProfileDialog(true)
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error('Could not create account', {
        description: error instanceof Error ? error.message : 'Try again',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        toast.error('Google sign-up failed', { description: error.message })
        throw error
      }
    } catch (error) {
      console.error('Google sign-up error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.username) {
        setShowProfileDialog(true)
      } else {
        router.push(userProfilePath(profile.username))
      }
    }

    void checkUser()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen h-screen w-full max-w-screen items-center justify-center px-4 py-4 lg:max-w-none">
      <section className="flex h-full w-full flex-col items-center justify-center lg:w-1/2">
        <div className="flex w-full max-w-[400px] flex-col gap-5">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-[#FF0048]">Join Clakete</h1>
            <span className="text-sm text-muted-foreground">Create your free account</span>
            <AuthClaketeWordmark className="absolute left-12 top-12" />
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="mt-4 w-full border border-black/10 bg-transparent p-[22px] font-semibold text-black hover:bg-[#FF0048]/10 hover:text-[#FF0048] dark:border-white/10 dark:text-white dark:hover:text-[#FF0048]"
          >
            <AuthGoogleIcon className="mr-2 h-4 w-4" />
            Google
          </Button>

          <div className="flex w-full items-center justify-center">
            <div className="h-px w-full bg-black/10 dark:bg-white/10" />
            <span className="px-4 text-sm text-muted-foreground">or</span>
            <div className="h-px w-full bg-black/10 dark:bg-white/10" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input
                        className="border border-black/10 py-[22px] dark:border-white/10"
                        placeholder="your@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input
                        className="border border-black/10 py-[22px] dark:border-white/10"
                        type="password"
                        placeholder="•••••••••••••"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handlePasswordChange()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full border border-black/10 bg-[#FF0048] p-[22px] font-semibold text-white hover:bg-[#FF0048]/80 dark:border-white/10"
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-[#FF0048] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <AuthMarketingPanel RiveComponent={RiveComponent} />

      <ProfileDialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      />
    </div>
  )
}