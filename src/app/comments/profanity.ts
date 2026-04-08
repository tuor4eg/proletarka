import BadWordsNext from "bad-words-next"
import ru from "bad-words-next/lib/ru"
import ruLat from "bad-words-next/lib/ru_lat"

const profanityFilter = new BadWordsNext()
profanityFilter.add(ru)
profanityFilter.add(ruLat)

export function containsProfanity(value: string): boolean {
    return profanityFilter.check(value)
}
