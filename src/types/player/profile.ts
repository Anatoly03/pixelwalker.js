
export type Date = `${number}-${number}-${number} ${number}:${number}:${number}.${number}Z`

/**
 * A public profile.
 * 
 * @example @todo
 * 
 * public profiles 
 */
export type PublicProfile = {
    readonly admin: boolean
    readonly banned: boolean
    readonly collectionId: string
    readonly collectionName: 'public_profiles'
    readonly created: Date
    readonly face: number
    readonly id: string
    readonly username: Uppercase<string>
}

/**
 * Yourself.
 */
// export type PublicUser = {
//     admin: false
//     banned: false
//     collectionId: '_pb_users_auth_'
//     collectionName: 'users'
//     created: Date
//     email: string
//     emailVisibility: boolean
//     face: number
//     id: string
//     updated: Date
//     username: string
//     verified: boolean
// }
