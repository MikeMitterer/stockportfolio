import type { InjectionKey, Ref } from 'vue'
import type { PortfolioAuthClient, PortfolioUser } from '@/api/account/client'

export const AUTH_CLIENT: InjectionKey<PortfolioAuthClient> = Symbol('portfolioAuthClient')
export const AUTH_USER: InjectionKey<Ref<PortfolioUser | null>> = Symbol('portfolioAuthUser')
export const AUTH_LOGOUT: InjectionKey<() => Promise<void>> = Symbol('portfolioLogout')
