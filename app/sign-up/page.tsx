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
import { getClientOrigin } from '@/lib/app-url'
import { usernameSchema } from '@/lib/onboarding'
import { checkUsernameAvailability } from '@/lib/username-availability'
import { useProfile } from '@/components/providers/profile-provider'

const formSchema = z.object({
  username: usernameSchema,
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function SignUp() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const supabase = useSupabaseClient()
  const { refreshProfile } = useProfile()

  const { rive, RiveComponent } = useRive({
    src: '/cat_password.riv',
    artboard: 'Main',
    stateMachines: ['PasswordStates'],
    autoplay: true,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '', password: '' },
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

      const availability = await checkUsernameAvailability(
        supabase,
        values.username,
      )
      if (availability.status !== 'available') {
        form.setError('username', {
          message: availability.message ?? 'Username unavailable',
        })
        return
      }

      const username = values.username.toLowerCase()

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${getClientOrigin()}/auth/callback`,
          data: { username },
        },
      })

      if (error) throw error

      const userId = data.user?.id
      if (userId && data.session) {
        const { error: profileError } = await supabase.from('users').insert({
          id: userId,
          username,
          avatar_url: null,
        })

        if (profileError) {
          if (profileError.code === '23505') {
            toast.error('This username is already taken')
            setShowProfileDialog(true)
            return
          }
          throw profileError
        }

        await refreshProfile()
        toast.success('Account created!')
        router.push('/onboarding')
        router.refresh()
        return
      }

      toast.success('Account created!', {
        description: data.session
          ? 'Choose your username to continue.'
          : 'Check your email to confirm, then sign in.',
      })

      if (data.session) {
        setShowProfileDialog(true)
      }
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
          redirectTo: `${getClientOrigin()}/auth/callback`,
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
            <h1 className="text-4xl font-bold text-brand">Join Clakete</h1>
            <span className="text-sm text-muted-foreground">Create your free account</span>
            <AuthClaketeWordmark className="absolute left-12 top-12" />
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="mt-4 w-full border border-black/10 bg-transparent p-[22px] font-semibold text-black hover:bg-brand/10 hover:text-brand dark:border-border dark:text-white dark:hover:text-brand"
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Username
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          @
                        </span>
                        <Input
                          className="border border-black/10 py-[22px] pl-8 dark:border-border"
                          placeholder="your_username"
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          {...field}
                          onChange={(e) => {
                            field.onChange(
                              e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                            )
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input
                        className="border border-black/10 py-[22px] dark:border-border"
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
                        className="border border-black/10 py-[22px] dark:border-border"
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
                className="w-full border border-black/10 bg-brand p-[22px] font-semibold text-white hover:bg-brand/80 dark:border-border"
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-brand hover:underline">
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
