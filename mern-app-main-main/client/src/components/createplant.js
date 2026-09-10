import React, { useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import API_URL from "../config"
import PlantFormWizard, { loadCollectionOptions } from "./PlantFormWizard"

const AUTOSAVE_KEY = "phyto-plant-draft"

export default function Create() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const cloneParam = searchParams.get("clone")
    const sugestaoParam = searchParams.get("sugestao")

    const handleLoad = useCallback(async ({ setOpcoesBanco }) => {
        await loadCollectionOptions(setOpcoesBanco)
    }, [])

    const handleSubmit = useCallback(async ({ formData, showToast }) => {
        if (sugestaoParam) formData.append("sugestaoId", sugestaoParam)
        const token = localStorage.getItem("token")
        const headers = {}
        if (token) headers.Authorization = `Bearer ${token}`

        const response = await fetch(`${API_URL}/plant/add`, {
            method: "POST",
            headers,
            body: formData
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            showToast(err.message || "Erro ao cadastrar", "error")
            return
        }

        localStorage.removeItem(AUTOSAVE_KEY)
        if (sugestaoParam) {
            showToast("Planta criada e sugestão concluída!")
            setTimeout(() => navigate("/moderar-sugestoes"), 1200)
        } else {
            showToast("Planta cadastrada com sucesso!")
            setTimeout(() => navigate("/plantlist"), 1200)
        }
    }, [navigate, sugestaoParam])

    return (
        <PlantFormWizard
            mode="create"
            heading={() => "Cadastrar Nova Planta"}
            loadingText="Carregando opções..."
            withReview
            autosaveKey={AUTOSAVE_KEY}
            cloneParam={cloneParam}
            sugestaoParam={sugestaoParam}
            submitLabel="Cadastrar Planta"
            submittingLabel="Cadastrando..."
            onLoad={handleLoad}
            onSubmit={handleSubmit}
        />
    )
}