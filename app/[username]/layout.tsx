'use client'
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { useState, useEffect } from 'react'
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

interface UserData {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
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
      followersCount: 0,
      followingCount: 0,
      isFollowing: false
    })
    const supabase = useSupabaseClient()
    const currentUser = useUser()
    const { username } = use(params)
    const { refreshProfile } = useProfile()
    const pathname = usePathname();
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
  
    const fetchProfile = async () => {
      try {
        // Primeiro, pega a sessão atual
        const { data: { session } } = await supabase.auth.getSession()
        
        // Depois busca os dados do perfil
        const { data, error } = await supabase
      .from('users')
          .select('*')
          .eq('username', username.toLowerCase())
      .single()
  
        if (error || !data) {
      notFound()
    }
  
        setUserData(data)
        setIsOwnProfile(session?.user?.id === data.id)
        
        // Buscar estatísticas após confirmar que o usuário existe
        fetchUserStats(data.id)
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        setLoading(false)
      }
    }
  
    const fetchUserStats = async (userId: string) => {
      try {
        // 1. Buscar contagem de filmes assistidos
        const { count: filmsCount, error: filmsError } = await supabase
          .from('film_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_watched', true)
        
        if (filmsError) {
          console.error('Erro ao buscar contagem de filmes:', filmsError)
        }
        
        // 2. Buscar contagem de seguidores (criar tabela se não existir)
        let followersCount = 0
        let followingCount = 0
        let isFollowing = false
        
        try {
          // Verificar se a tabela user_followers existe
          const { error: tableCheckError } = await supabase
            .from('user_followers')
            .select('user_id', { count: 'exact', head: true })
            .limit(1)
          
          // Se a tabela existir, buscar contagens
          if (!tableCheckError) {
            // Buscar seguidores
            const { count: followers, error: followersError } = await supabase
              .from('user_followers')
              .select('follower_id', { count: 'exact', head: true })
              .eq('user_id', userId)
            
            if (!followersError) {
              followersCount = followers || 0
            }
            
            // Buscar seguindo
            const { count: following, error: followingError } = await supabase
              .from('user_followers')
              .select('user_id', { count: 'exact', head: true })
              .eq('follower_id', userId)
            
            if (!followingError) {
              followingCount = following || 0
            }
            
            // Verificar se o usuário atual está seguindo este perfil
            if (currentUser) {
              const { data: followData, error: followCheckError } = await supabase
                .from('user_followers')
                .select('*')
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
        
        // Atualizar estado com as contagens
        setStats(prev => ({
          ...prev,
          filmsCount: filmsCount || 0,
          followersCount,
          followingCount,
          isFollowing
        }))
        
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
        setLoading(false)
      }
    }
  

  
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
        
        await fetchProfile()
        await refreshProfile()
      } catch (error) {
        console.error('Erro completo:', error)
        throw error
      }
    }
  
    useEffect(() => {
      fetchProfile()
    }, [username])
  
    useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        fetchProfile()
      })

      return () => subscription.unsubscribe()
    }, [])
  
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
          .select('*')
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
      <section className="py-8 mt-20 px-4 w-full max-w-[1152px]">
       <Skeleton 
        className="w-full h-[450px] border dark:border-white/20  border-black/20 rounded-lg bg-cover bg-center relative"

      />
      <div className="px-8 w-full ">
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
    if (!userData) return null
  
  return (
    <section className="py-8 mt-20 px-4 w-full max-w-[1152px]">
        {/* Banner */}
        <div 
        className="w-full h-[450px] border dark:border-white/20  border-black/20 rounded-lg bg-cover bg-center relative group"
        style={{ 
          backgroundImage: `url(${userData.banner_url || '/default-banner.jpg'})`,
          backgroundPosition: 'center 20%'
        }}
        onClick={() => isOwnProfile && setShowBannerEdit(true)}
      >
        {isOwnProfile && (
          <button 
            onClick={() => setShowBannerEdit(true)}
            className="absolute z-10 w-full backdrop-blur-[1.2px] h-full rounded-lg inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="text-white">Edit Banner</span>
          </button>
        )}
        <div className="absolute inset-0 bg-gradient-to-t  rounded-lg from-black/50 to-transparent" />
      </div>
      
      {/* Profile info */}
      <div className="px-8 w-full ">
        <div className="relative z-10">
          <div className="flex gap-6 ">
          <div className="flex flex-col w-full gap-6">
            {/* Avatar */}
            <div className="sticky top-28 flex flex-col gap-6">
            <div className="relative -mt-24 aspect-square border-4  dark:border-[#090909] border-white  shadow-sm  overflow-clip h-36 group rounded-2xl max-w-36">
            <Avatar className="w-full h-full rounded-md shadow-none ">
              <AvatarImage src={userData.avatar_url || undefined} alt={userData.display_name || userData.username || ''} />
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
                        avatarUrl={userData.avatar_url}
                        bannerUrl={userData.banner_url}
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
          <Tabs value={activeTab} className="w-full mt-6 translate-x-8">
          <TabsList className="dark:bg-[#111111] w-full h-12">
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
    {children}
  </div>
  
  </Tabs>
          </div>
        </div>
        </div>
      </div>

      {/* Modais de edição */}
        <ImageEditDialog
        isOpen={showAvatarEdit}
          onClose={() => setShowAvatarEdit(false)}
        onSave={async (image: string) => {
          await updateProfile({ avatar_url: image });
            setShowAvatarEdit(false);
          }}
          onSelect={() => {}}
        type="avatar"
        />

        <ImageEditDialog
        isOpen={showBannerEdit}
          onClose={() => setShowBannerEdit(false)}
        onSave={async (image: string) => {
          await updateProfile({ banner_url: image });
            setShowBannerEdit(false);
          }}
          onSelect={() => {}}
        type="banner"
        />
    <div/>
    </section>
  ) 
}