'use client'
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { useState, useEffect, useRef, useCallback } from 'react'
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog"
import { MdEdit } from "react-icons/md"
import { notFound, usePathname } from 'next/navigation'
import { use } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useProfile } from "@/components/providers/profile-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ProfileLayoutProvider,
  type ProfileLayoutUser,
} from "@/components/providers/profile-layout-context"
import { parseTmdbStoredImageMeta } from "@/lib/tmdb-stored-image"
import {
  invalidatePublicProfileCache,
  readPublicProfileCache,
  writePublicProfileCache,
} from "@/lib/profile-public-cache"
import { profileBannerPresentation, profileAvatarPresentation } from "@/lib/profile-media"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import type { Json } from "@/lib/supabase/database.types"

interface UserData extends ProfileLayoutUser {
  website_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  home_preferences?: Json | null;
}




interface ProfileLayoutProps {
  children: React.ReactNode
  params: Promise<{
    username: string
  }>
}

export default function ProfileLayout({ children, params }: ProfileLayoutProps) {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [isOwnProfile, setIsOwnProfile] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showAvatarEdit, setShowAvatarEdit] = useState(false)
    const [showBannerEdit, setShowBannerEdit] = useState(false)
    const [stats, setStats] = useState({
      filmsCount: 0,
      seriesCount: 0,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false
    })
    const supabase = useSupabaseClient()
    const currentUser = useUser()
    const { username } = use(params)
    const { refreshProfile } = useProfile()
    const pathname = usePathname()
    const usernameRef = useRef(username)
    useEffect(() => {
      usernameRef.current = username
    }, [username])
    const getTabFromPath = () => {
      if (pathname.endsWith('/films')) return 'films';
      if (pathname.endsWith('/lists')) return 'lists';
      if (pathname.endsWith('/reviews')) return 'reviews';
      if (pathname.endsWith('/activity')) return 'activity';
      if (pathname.endsWith('/watchlist')) return 'watchlist';
      // Se for só /[username] ou /[username]/profile, retorna 'profile'
      if (
        pathname === `/${username}` ||
        pathname.endsWith('/profile')
      ) return 'profile';
      return 'profile'; // fallback
    };
    const activeTab = getTabFromPath();
  
    const fetchUserStats = useCallback(
      async (
        userId: string,
        cachePack?: { profile: UserData; isOwnProfile: boolean; targetUsername: string },
      ) => {
        try {
          const [
            { count: filmsCount, error: filmsError },
            { count: seriesCount, error: seriesError },
          ] = await Promise.all([
            supabase
              .from('items_interactions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('is_watched', true)
              .eq('media_type', 'movie'),
            supabase
              .from('items_interactions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('is_watched', true)
              .eq('media_type', 'tv'),
          ])

          if (filmsError) {
            console.error('Erro ao buscar contagem de filmes:', filmsError)
          }
          if (seriesError) {
            console.error('Erro ao buscar contagem de séries:', seriesError)
          }

          let followersCount = 0
          let followingCount = 0
          let isFollowing = false

          try {
            const { error: tableCheckError } = await supabase
              .from('user_followers')
              .select('user_id', { count: 'exact', head: true })
              .limit(1)

            if (!tableCheckError) {
              const { count: followers, error: followersError } = await supabase
                .from('user_followers')
                .select('follower_id', { count: 'exact', head: true })
                .eq('user_id', userId)

              if (!followersError) {
                followersCount = followers || 0
              }

              const { count: following, error: followingError } = await supabase
                .from('user_followers')
                .select('user_id', { count: 'exact', head: true })
                .eq('follower_id', userId)

              if (!followingError) {
                followingCount = following || 0
              }

              if (currentUser) {
                const { data: followData, error: followCheckError } = await supabase
                  .from('user_followers')
                  .select('user_id')
                  .eq('user_id', userId)
                  .eq('follower_id', currentUser.id)
                  .maybeSingle()

                if (!followCheckError && followData) {
                  isFollowing = true
                } else {
                  isFollowing = false
                }
              }
            }
          } catch (error) {
            console.error('Erro ao verificar tabela de seguidores:', error)
          }

          const snapshot = {
            filmsCount: filmsCount || 0,
            seriesCount: seriesCount || 0,
            followersCount,
            followingCount,
            isFollowing,
          }

          if (cachePack && usernameRef.current.toLowerCase() !== cachePack.targetUsername) {
            setLoading(false)
            return
          }

          setStats((prev) => ({
            ...prev,
            ...snapshot,
          }))

          setLoading(false)

          if (
            cachePack &&
            usernameRef.current.toLowerCase() === cachePack.targetUsername
          ) {
            const p = cachePack.profile
            writePublicProfileCache(cachePack.targetUsername, {
              user: {
                id: p.id,
                username: p.username,
                display_name: p.display_name,
                bio: p.bio,
                avatar_url: p.avatar_url,
                banner_url: p.banner_url,
                website_url: p.website_url,
                twitter_url: p.twitter_url,
                instagram_url: p.instagram_url,
                avatar_meta: p.avatar_meta ?? null,
                banner_meta: p.banner_meta ?? null,
              },
              isOwnProfile: cachePack.isOwnProfile,
              stats: snapshot,
              fetchedAt: Date.now(),
            })
          }
        } catch (error) {
          console.error('Erro ao buscar estatísticas:', error)
          setLoading(false)
        }
      },
      [supabase, currentUser],
    )

    const fetchProfile = useCallback(
      async (targetUsername: string) => {
        const { data: { session }, error: sessionError } =
          await supabase.auth.getSession()
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError)
        }

        const { data, error } = await supabase
          .from('users')
          .select(
            'id, username, display_name, bio, avatar_url, banner_url, avatar_meta, banner_meta, website_url, twitter_url, instagram_url, home_preferences',
          )
          .eq('username', targetUsername)
          .maybeSingle()

        if (error) {
          console.error('Erro ao carregar perfil:', error)
          setLoading(false)
          return
        }

        if (!data) {
          notFound()
          return
        }

        if (usernameRef.current.toLowerCase() !== targetUsername) {
          return
        }

        const parsed: UserData = {
          ...data,
          avatar_meta: parseTmdbStoredImageMeta(data.avatar_meta),
          banner_meta: parseTmdbStoredImageMeta(data.banner_meta),
        }
        const own = session?.user?.id === data.id

        setUserData(parsed)
        setIsOwnProfile(own)

        await fetchUserStats(data.id, {
          profile: parsed,
          isOwnProfile: own,
          targetUsername,
        })
      },
      [supabase, fetchUserStats],
    )

    const fetchProfileRef = useRef(fetchProfile)
    fetchProfileRef.current = fetchProfile
  

  
    const updateProfile = async (updates: Partial<UserData>) => {
      if (!userData) return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          throw new Error('Usuário não autenticado')
        }
  
        if (session.user.id !== userData.id) {
          throw new Error('Não autorizado a atualizar este perfil')
        }
        
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userData.id)
        
        if (error) {
          console.error('Erro ao atualizar:', error.message)
          throw error
        }
        
        invalidatePublicProfileCache(userData.username)
        await fetchProfile(userData.username.toLowerCase())
        await refreshProfile()
      } catch (error) {
        console.error('Erro completo:', error)
        throw error
      }
    }
  
    useEffect(() => {
      const cached = readPublicProfileCache(username)
      if (cached) {
        setUserData(cached.user as UserData)
        setStats((prev) => ({ ...prev, ...cached.stats }))
        setIsOwnProfile(cached.isOwnProfile)
        setLoading(false)
      } else {
        setUserData(null)
        setLoading(true)
      }
    }, [username])

    useEffect(() => {
      void fetchProfileRef.current(username.toLowerCase())
    }, [username])

    useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        void fetchProfileRef.current(usernameRef.current.toLowerCase())
      })

      return () => subscription.unsubscribe()
    }, [supabase])
  
    useEffect(() => {
      if (userData && currentUser) {
        fetchUserStats(userData.id)
      }
    }, [userData, currentUser])
  
    const toggleFollow = async () => {
      if (!userData || !currentUser) {
        toast.error("Você precisa estar logado para seguir usuários")
        return
      }
      
      if (isOwnProfile) {
        return
      }
      
      try {
        // Verificar se a tabela user_followers existe
        const { error: tableCheckError } = await supabase
          .from('user_followers')
          .select('user_id', { count: 'exact', head: true })
          .limit(1)
        
        // Se houver erro, a tabela provavelmente não existe, então vamos criá-la
        if (tableCheckError) {
          // Tentar criar a tabela usando a função RPC
          const { error: createError } = await supabase
            .rpc('create_followers_table')
          
          if (createError) {
            console.error('Erro ao criar tabela de seguidores:', createError)
            toast.error("Funcionalidade de seguidores ainda não está disponível")
            return
          }
          
         
        }
        
        // Verificar novamente o status atual
        const { data: currentStatus, error: statusError } = await supabase
          .from('user_followers')
          .select('user_id')
          .eq('user_id', userData.id)
          .eq('follower_id', currentUser.id)
          .maybeSingle()
        
        const isCurrentlyFollowing = !statusError && !!currentStatus
        
        
        if (isCurrentlyFollowing) {
          // Deixar de seguir
          const { error: unfollowError } = await supabase
            .from('user_followers')
            .delete()
            .eq('user_id', userData.id)
            .eq('follower_id', currentUser.id)
          
          if (unfollowError) {
            console.error('Erro ao deixar de seguir:', unfollowError)
            throw unfollowError
          }
          
          // Atualizar contagens
          setStats(prev => ({
            ...prev,
            followersCount: Math.max(0, prev.followersCount - 1),
            isFollowing: false
          }))
          
          toast.success("Você deixou de seguir este usuário")
          
        } else {
          // Seguir
          const { error: followError } = await supabase
            .from('user_followers')
            .insert({
              user_id: userData.id,
              follower_id: currentUser.id,
              created_at: new Date().toISOString()
            })
          
          if (followError) {
            console.error('Erro ao seguir:', followError)
            throw followError
          }
          
          // Atualizar contagens
          setStats(prev => ({
            ...prev,
            followersCount: prev.followersCount + 1,
            isFollowing: true
          }))
          
          toast.success("Você começou a seguir este usuário")
          
        }
      } catch (error: unknown) {
        console.error('Erro ao alternar seguidor:', error)
        const errorMessage = error instanceof Error ? error.message : 'Desconhecido'
        toast.error(`Erro ao seguir/deixar de seguir: ${errorMessage}`)
      }
    }
  
    if (loading) return (
      <section className="relative z-10 mt-20 w-full py-8">
       <Skeleton 
        className="relative h-[485px] w-full min-w-0 overflow-hidden rounded-none border-0 bg-cover bg-center ring-1 ring-white/[0.06]"

      />
      <div className="mx-auto w-full max-w-6xl px-8">
        <div className="relative z-10">
          <div className="flex gap-6">
          <div className="flex flex-col w-full  gap-6">
      {/* Avatar */}
      <div className="relative bg-black -mt-24 aspect-square border-4  dark:border-[#090909] border-white  shadow-sm  overflow-clip h-36 group rounded-2xl max-w-36">
      <Skeleton className="w-full h-full rounded-md shadow-none ">
        
      </Skeleton>
  
      </div>

      {/* Info */}
      <div className="flex-1 flex-col gap-2 flex w-full max-w-[370px]">
        <Skeleton className="text-3xl w-32 font-bold dark:text-white">
        ㅤㅤ
        </Skeleton>
        <Skeleton className="text-lg w-16 -mt-1 text-muted-foreground">
        ㅤㅤ
        </Skeleton>
        
        <div className='flex'>
          
        <Skeleton className='flex w-full h-12 items-center mt-2 gap-4'> 
           
         
          </Skeleton>
        </div>
       
          <Skeleton className="mt-2 text-muted-foreground">ㅤㅤ</Skeleton>
            </div>
        </div>
        </div>
        </div>
        </div>
        </section>

    )
    if (!userData && !loading) {
      return (
        <section className="mx-auto mt-16 w-full max-w-6xl px-4 py-16 text-center sm:px-6">
          <p className="text-muted-foreground">Não foi possível carregar este perfil.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-[#FF0048] underline underline-offset-2 hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </section>
      )
    }
    if (!userData) return null

  const bannerDisplay = profileBannerPresentation(userData)
  const avatarDisplay = profileAvatarPresentation(userData)

  return (
    <section className="relative z-10 mt-[3.75rem] w-full">
        {/* Banner */}
        <div 
        className="group relative h-[567px] w-full min-w-0 overflow-hidden rounded-none border-0 bg-cover bg-center ring-1 ring-b ring-white/[0.06] "
        style={{ 
          backgroundImage: `url(${bannerDisplay.src})`,
          backgroundPosition: bannerDisplay.backgroundPosition,
        }}
        onClick={() => isOwnProfile && setShowBannerEdit(true)}
      >
        {isOwnProfile && (
          <button 
            onClick={() => setShowBannerEdit(true)}
            className="absolute inset-0 z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-none bg-black/50 opacity-0 backdrop-blur-[1.2px] transition-opacity group-hover:opacity-100 "
          >
            <span className="text-white">Edit Banner</span>
          </button>
        )}
        <div className="absolute inset-0 rounded-none bg-gradient-to-t from-black/50 to-transparent z" />
      </div>

      <div className="mx-auto w-full max-w-6xl">
      {/* Profile info */}
      <div className="w-full">
        <div className="relative z-10">
          <div className="flex flex-wrap gap-6 lg:flex-nowrap lg:items-stretch">
          <div className="flex flex-col w-full gap-6">
            {/* Avatar */}
            <div className="sticky top-[calc(env(safe-area-inset-top,0px)+12rem)] z-20 flex flex-col gap-6 self-start">
            <div className="relative -mt-24 aspect-square ring-2  dark:ring-[#090909] ring-white   shadow-sm  overflow-clip h-36 group rounded-2xl max-w-36">
            <Avatar className="w-full h-full rounded-md shadow-none ">
              <AvatarImage
                src={avatarDisplaySrc(avatarDisplay.src, { allowGifPlayback: true }) || undefined}
                alt={userData.display_name || userData.username || ''}
                className="object-cover"
                style={
                  avatarDisplay.objectPosition
                    ? { objectPosition: avatarDisplay.objectPosition }
                    : undefined
                }
              />
              <AvatarFallback className="rounded-md text-2xl font-semibold w-full flex">{(userData.display_name?.[0] || userData.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
            </Avatar>
        {isOwnProfile && (
                <button 
                  onClick={() => setShowAvatarEdit(true)}
                  className="absolute inset-0 rounded-2xl backdrop-blur-[1.2px] flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-white"><MdEdit className='h-6 w-auto' /></span>
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex-col flex w-full max-w-[370px]">
              <h1 className="text-3xl font-bold dark:text-white">
                {userData.display_name || userData.username}
              </h1>
              <h2 className="text-lg -mt-1 text-muted-foreground">
                @{userData.username}
              </h2>
              
              <div className='flex'>
                
              <div className='flex items-center mt-2 gap-4'> 
                  <div className="flex flex-col">
                    <span className="dark:text-white text-xl font-semibold text-black">{stats.filmsCount}</span>
                    <span className="text-muted-foreground text-sm">Films</span>
                  </div>

                  <div className="text-muted-foreground text-sm w-[1px] h-[61%] bg-muted-foreground/40"/>

                   <div className="flex flex-col">
                    <span className="dark:text-white text-xl font-semibold text-black">{stats.seriesCount}</span>
                    <span className="text-muted-foreground text-sm">Series</span>
                  </div>
                  
                  <div className="text-muted-foreground text-sm w-[1px] h-[61%] bg-muted-foreground/40"/>

                  <div className="flex flex-col">
                    <span className="dark:text-white text-xl font-semibold text-black">{stats.followersCount}</span>
                    <span className="text-muted-foreground text-sm">Followers</span>
                  </div>

                  <div className="text-muted-foreground text-sm w-[1px] h-[61%] bg-muted-foreground/40"/>

                  <div className="flex flex-col">
                    <span className="dark:text-white text-xl font-semibold text-black">{stats.followingCount}</span>
                    <span className="text-muted-foreground text-sm">Following</span>
                  </div>

                  <div className="text-muted-foreground text-sm w-[1px] h-[61%] bg-muted-foreground/40"/>

                  {isOwnProfile ? (
                    <div className="ml-4">
                  <EditProfileDialog
                    username={userData.username}
                    displayName={userData.display_name}
                    bio={userData.bio}
                    avatarUrl={userData.avatar_url ?? undefined}
                    websiteUrl={userData.website_url ?? undefined}
                        twitterUrl={userData.twitter_url ?? undefined}
                        instagramUrl={userData.instagram_url ?? undefined}
                        homePreferences={userData.home_preferences ?? null}
                        onHomeBackdropUpdated={() =>
                          fetchProfile(usernameRef.current.toLowerCase())
                        }
                        onUpdate={updateProfile}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={toggleFollow}
                      className="px-4 py-2 bg-[#FF0048]  rounded-md  transition-colors w-full bg-[#FF0048]/10 text-[#FF0048]/70 border border-black/10 dark:border-white/10 flex items-center justify-center"
                    >
                      {stats.isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    
                  )}
                </div>
              </div>
              {userData.bio && (
                <p className="mt-6 text-muted-foreground">{userData.bio}</p>
        )}
      </div>
          </div>
          </div>
          <div className="w-full">
          <Tabs value={activeTab} className="w-full mt-6 ">
          <TabsList className="dark:bg-[#09090B] border border-white/[0.08] w-full h-12">
    <Link href={`/${username}`}>
    <TabsTrigger className="px-8 w-full py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="profile">Profile</TabsTrigger>
    </Link>
    <Link href={`/${username}/films`}>
    <TabsTrigger className="px-8 w-full py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="films">
    Films
    </TabsTrigger>
    </Link>
    
    <Link href={`/${username}/lists`}>
    <TabsTrigger className="px-8 w-full py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="lists">
    Lists
    </TabsTrigger>
    </Link>

    <Link href={`/${username}/reviews`}>
    <TabsTrigger className="px-8 w-full py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="reviews">Reviews</TabsTrigger>
    </Link>
    <Link href={`/${username}/activity`}>
    <TabsTrigger className="px-8 w-full py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="activity">Activity</TabsTrigger>
    </Link>
    <Link href={`/${username}/watchlist`}>
    <TabsTrigger className="px-8 w-full py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="watchlist">Watchlist</TabsTrigger>
    </Link>
  </TabsList>
  
  <div className="w-full">
    <ProfileLayoutProvider value={{ userData, isOwnProfile }}>
      {children}
    </ProfileLayoutProvider>
  </div>
  
  </Tabs>
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Modais de edição */}
        <ImageEditDialog
        isOpen={showAvatarEdit}
          onClose={() => setShowAvatarEdit(false)}
        onSave={async (image: string) => {
          if (image) {
            await updateProfile({ avatar_url: image, avatar_meta: null })
          } else {
            await fetchProfile(usernameRef.current.toLowerCase())
          }
          setShowAvatarEdit(false)
        }}
          onSelect={() => {}}
        type="avatar"
        />

        <ImageEditDialog
        isOpen={showBannerEdit}
          onClose={() => setShowBannerEdit(false)}
        onSave={async (image: string) => {
          if (image) {
            await updateProfile({ banner_url: image, banner_meta: null })
          } else {
            await fetchProfile(usernameRef.current.toLowerCase())
          }
          setShowBannerEdit(false)
        }}
          onSelect={() => {}}
        type="banner"
        />
    </section>
  ) 
}
