import React, { useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import API_URL from "../config"
import PlantFormWizard, { loadCollectionOptions } from "./PlantFormWizard"
import { decodeId } from "../idCodec"

export default function Edit() {
    const params = useParams()
    const navigate = useNavigate()
    const realId = decodeId(params.id)

    const handleLoad = useCallback(async ({ setForm, setExistingImages, setOpcoesBanco, showToast }) => {
        const [plantRes] = await Promise.all([
            fetch(`${API_URL}/plant/${realId}`),
            loadCollectionOptions(setOpcoesBanco)
        ])

        if (!plantRes.ok) {
            showToast("Planta não encontrada", "error")
            setTimeout(() => navigate("/plantlist"), 2000)
            return
        }

        const plant = await plantRes.json()
        setForm(plant)
        setExistingImages(plant.imagesPath || (plant.imagePath ? [plant.imagePath] : []))
    }, [realId, navigate])

    const handleSubmit = useCallback(async ({ formData, showToast }) => {
        const token = localStorage.getItem("token")
        const headers = {}
        if (token) headers.Authorization = `Bearer ${token}`

        const response = await fetch(`${API_URL}/plant/${realId}`, {
            method: "PUT",
            headers,
            body: formData
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            showToast(err.message || "Erro ao atualizar", "error")
            return
        }

        showToast("Planta atualizada com sucesso!")
        setTimeout(() => navigate("/plantlist"), 1200)
    }, [realId, navigate])

    return (
        <PlantFormWizard
            mode="edit"
            heading={form => `Editar: ${form.name}`}
            loadingText="Carregando dados da planta..."
            submitLabel="Salvar Alterações"
            submittingLabel="Salvando..."
            onLoad={handleLoad}
            onSubmit={handleSubmit}
        />
    )
}