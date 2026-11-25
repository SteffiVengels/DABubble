export interface Reaction {
    id: number;
    created_at: string;
    message_id: number;
    user_id: string;
    emoji_code: string;
}

export interface ReactionGroup {
    code: string;
    count: number;
    reactedByMe: boolean;
    userIds: string[];
}
