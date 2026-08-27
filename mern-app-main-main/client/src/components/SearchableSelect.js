import React, { useState, useEffect, useRef } from "react"

export default function SearchableSelect({ campo, placeholder, value, options, onChange, onManage }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const ref = useRef(null)

    const selected = options.find(opt => opt._id === value)

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filtered = (options || [])
        .filter(opt => !query || opt.name.toLowerCase().includes(query.toLowerCase()))

    function handleSelect(id) {
        onChange(id)
        setOpen(false)
        setQuery("")
    }

    return (
        <div className="wizard-select-group position-relative" ref={ref}>
            <div className="wizard-searchable">
                <input
                    type="text"
                    className="form-control wizard-searchable__input"
                    value={selected ? selected.name : query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {open && (
                    <ul className="wizard-searchable__list">
                        <li
                            key="clear"
                            className={`wizard-searchable__option ${!value ? "wizard-searchable__option--active" : ""}`}
                            onMouseDown={() => handleSelect("")}
                        >
                            — {placeholder} —
                        </li>
                        {filtered.map(opt => (
                            <li
                                key={opt._id}
                                className={`wizard-searchable__option ${opt._id === value ? "wizard-searchable__option--active" : ""}`}
                                onMouseDown={() => handleSelect(opt._id)}
                            >
                                {opt.name}
                            </li>
                        ))}
                        {filtered.length === 0 && (
                            <li className="wizard-searchable__empty">Nenhum valor encontrado</li>
                        )}
                    </ul>
                )}
            </div>
            <button
                type="button"
                className="wizard-select-plus"
                onClick={onManage}
                title="Gerenciar valores"
            >
                +
            </button>
        </div>
    )
}
