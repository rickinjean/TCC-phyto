import React, { Component } from "react"

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo)
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary container text-center py-5">
                    <div className="error-boundary__icon">🪴</div>
                    <h3 className="error-boundary__title">Algo deu errado</h3>
                    <p className="error-boundary__text">
                        Ocorreu um erro inesperado ao exibir esta página. Tente recarregar.
                    </p>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={this.handleReload}
                    >
                        Recarregar página
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
