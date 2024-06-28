
export type Date = `${number}-${number}-${number} ${number}:${number}:${number}.${number}Z`

/**
 * A public profile.
 * 
 * @example @todo
 * 
 * public profiles 
 */
export class PublicProfile {
    admin: boolean
    banned: boolean
    collectionId: string
    collectionName: 'public_profiles'
    created: Date
    face: number
    id: string
    username: Uppercase<string>

    constructor(args: PublicProfile) {
        this.admin = args.admin
        this.banned = args.banned
        this.collectionId = args.collectionId
        this.collectionName = 'public_profiles'
        this.created = args.created
        this.face = args.face
        this.id = args.id
        this.username = args.username
    }
}

export class PublicUser {
    admin: false
    banned: false
    collectionId: '_pb_users_auth_'
    collectionName: 'users'
    created: Date
    email: string
    emailVisibility: boolean
    face: number
    id: string
    updated: Date
    username: string
    verified: boolean

    constructor(args: PublicUser) {
        this.admin = args.admin
        this.banned = args.banned
        this.collectionId = '_pb_users_auth_'
        this.collectionName = 'users'
        this.created = args.created
        this.email = args.email
        this.emailVisibility = args.emailVisibility
        this.face = args.face
        this.id = args.id
        this.updated = args.updated
        this.username = args.username
        this.verified = args.verified
    }
}

