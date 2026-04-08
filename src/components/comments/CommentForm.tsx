"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { createComment, type CreateCommentResult } from "@/app/comments/actions"
import { AltchaWidget } from "@/components/comments/AltchaWidget"
import { SubmitButton } from "@/components/SubmitButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const INITIAL_STATE: CreateCommentResult = null

export function CommentForm({ entityId }: { entityId: number }) {
    const [state, formAction] = useActionState(createComment, INITIAL_STATE)
    const containerRef = useRef<HTMLDivElement>(null)
    const formRef = useRef<HTMLFormElement>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [body, setBody] = useState("")
    const [author, setAuthor] = useState("")
    const [mode, setMode] = useState<"captcha" | "ready">("captcha")
    const [resetKey, setResetKey] = useState(0)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isExpanded) return

        const rafId = window.requestAnimationFrame(() => {
            containerRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            })
        })

        return () => window.cancelAnimationFrame(rafId)
    }, [isExpanded])

    useEffect(() => {
        if (!isMounted) return

        const intervalId = window.setInterval(() => {
            const altchaInput = formRef.current?.elements.namedItem("altcha")
            const hasPayload =
                altchaInput instanceof HTMLInputElement && altchaInput.value.trim().length > 0

            setMode(hasPayload ? "ready" : "captcha")
        }, 200)

        return () => window.clearInterval(intervalId)
    }, [isMounted])

    useEffect(() => {
        if (!state) return

        if (state.type === "error") {
            toast.error(state.message)
            return
        }

        formRef.current?.reset()
        const altchaInput = formRef.current?.elements.namedItem("altcha")
        if (altchaInput instanceof HTMLInputElement) {
            altchaInput.value = ""
        }
        setBody("")
        setAuthor("")
        setIsExpanded(false)
        setMode("captcha")
        setResetKey((key: number) => key + 1)
        toast.success(state.message)
    }, [state])

    return (
        <div ref={containerRef} className="space-y-4">
            <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-paper-border bg-white/70 px-4 text-sm text-ink hover:bg-paper-dark/60"
                onClick={() => setIsExpanded((value) => !value)}
                aria-expanded={isExpanded}
            >
                <span>{isExpanded ? "Скрыть форму" : "Оставить отклик"}</span>
                <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                    }`}
                />
            </Button>

            {isExpanded && (
                <div className="space-y-4 rounded-2xl border border-paper-border bg-white/50 p-4">
                    <p className="text-sm text-ink-muted leading-relaxed">
                        Здесь можно оставить короткое воспоминание, уточнение или отклик.
                        Комментарий появится после модерации.
                    </p>
                    <p className="text-xs text-ink-muted leading-relaxed">
                        Пожалуйста, сохраняйте уважительный тон и избегайте грубых выражений.
                    </p>

                    <form ref={formRef} action={formAction} className="space-y-4">
                        <input type="hidden" name="entityId" value={entityId} />
                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            className="hidden"
                            aria-hidden="true"
                        />

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="comment-body"
                                    className="text-sm font-medium text-ink"
                                >
                                    Комментарий
                                </label>
                                <Textarea
                                    id="comment-body"
                                    name="body"
                                    value={body}
                                    onChange={(event) => setBody(event.target.value)}
                                    required
                                    minLength={3}
                                    maxLength={2000}
                                    placeholder="Короткое воспоминание, уточнение или отклик"
                                    className="min-h-24 bg-white text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="comment-author"
                                    className="text-sm font-medium text-ink"
                                >
                                    Имя или псевдоним
                                </label>
                                <Input
                                    id="comment-author"
                                    name="author"
                                    value={author}
                                    onChange={(event) => setAuthor(event.target.value)}
                                    maxLength={80}
                                    placeholder="Можно оставить пустым"
                                    className="h-9 bg-white text-sm"
                                />
                            </div>
                        </div>

                        {isMounted && (
                            <div className="rounded-2xl border border-paper-border bg-paper-dark/60 px-3 py-2">
                                <AltchaWidget resetKey={resetKey} hidden={mode !== "captcha"} />
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs text-ink-muted leading-relaxed">
                                Комментарий появится на странице после модерации.
                            </p>
                            {isMounted && mode === "ready" && (
                                <SubmitButton label="Отправить" pendingLabel="Отправка…" />
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
