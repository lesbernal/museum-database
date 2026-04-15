// components/GalleryForm.jsx
import { useState, useEffect } from "react";
import { getExhibitions, getBuildings } from "../services/api";
import "../styles/GalleryForm.css";

export default function GalleryForm({ onSubmit, initialData = null, onCancel, isOpen = true }) {
    const [form, setForm] = useState({
        gallery_name: initialData?.gallery_name || "",
        floor_number: initialData?.floor_number ?? "",
        square_footage: initialData?.square_footage || "",
        climate_controlled: initialData?.climate_controlled ?? "",
        building_id: initialData?.building_id || "",
        exhibition_ids: initialData?.exhibition_ids || [],
    });

    const [buildings, setBuildings] = useState([]);
    const [exhibitions, setExhibitions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Load dropdowns
    useEffect(() => {
        loadBuildings();
        loadExhibitions();
    }, []);

    // Prefill for edit
    useEffect(() => {
        if (initialData) {
            setForm({
                gallery_name: initialData.gallery_name || "",
                floor_number: initialData.floor_number ?? "",
                square_footage: initialData.square_footage || "",
                climate_controlled: initialData.climate_controlled ?? "",
                building_id: initialData.building_id || "",
                exhibition_ids: initialData.exhibition_ids || [],
            });
        }
    }, [initialData]);

    const loadBuildings = async () => {
        try {
            const data = await getBuildings();
            setBuildings(data);
        } catch (err) {
            console.error("Failed to load buildings:", err);
        }
    };

    const loadExhibitions = async () => {
        try {
            const data = await getExhibitions();
            setExhibitions(data);
        } catch (err) {
            console.error("Failed to load exhibitions:", err);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.gallery_name.trim()) newErrors.gallery_name = "Gallery name is required";
        if (form.floor_number === "" || form.floor_number === null) {
            newErrors.floor_number = "Floor number is required";
        } else if (isNaN(parseInt(form.floor_number))) {
            newErrors.floor_number = "Floor number must be a number";
        }
        if (!form.square_footage) {
            newErrors.square_footage = "Square footage is required";
        } else if (isNaN(parseFloat(form.square_footage)) || parseFloat(form.square_footage) <= 0) {
            newErrors.square_footage = "Please enter a valid square footage";
        }
        if (form.climate_controlled === "") newErrors.climate_controlled = "Climate control is required";
        if (!form.building_id) newErrors.building_id = "Building is required";

        if (form.floor_number === "" || form.floor_number === null) {
            newErrors.floor_number = "Floor number is required";
        } else if (isNaN(parseInt(form.floor_number))) {
            newErrors.floor_number = "Floor number must be a number";
        } else if (parseInt(form.floor_number) < 1 || parseInt(form.floor_number) > 100) {
            newErrors.floor_number = "Floor number must be between 1 and 100";
        }

        if (!form.square_footage) {
            newErrors.square_footage = "Square footage is required";
        } else if (isNaN(parseFloat(form.square_footage)) || parseFloat(form.square_footage) <= 0) {
            newErrors.square_footage = "Please enter a valid square footage";
        } else if (parseFloat(form.square_footage) > 10000) {
            newErrors.square_footage = "Square footage seems too large";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: null });
    }

    function handleExhibitionToggle(exhibitionId) {
        const id = String(exhibitionId);
        const current = form.exhibition_ids.map(String);
        const updated = current.includes(id)
            ? current.filter((eid) => eid !== id)
            : [...current, id];
        setForm({ ...form, exhibition_ids: updated });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(form);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);

            if (!initialData) {
                setForm({
                    gallery_name: "",
                    floor_number: "",
                    square_footage: "",
                    climate_controlled: "",
                    building_id: "",
                    exhibition_ids: [],
                });
            }
        } catch (error) {
            console.error("Error saving gallery:", error);
            setErrors({ submit: "Failed to save gallery. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) return null;

    return (
        <>
            {showSuccessToast && (
                <div className="toast success">
                    Gallery {initialData ? "updated" : "added"} successfully!
                </div>
            )}

            <div className="modal-overlay" onClick={onCancel}>
                <div className="modal-content gallery-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{initialData ? "Edit Gallery" : "➕ Add New Gallery"}</h2>
                        <button className="close-btn" onClick={onCancel}>&times;</button>
                    </div>

                    <form onSubmit={handleSubmit} className="gallery-form">
                        <div className="form-grid">

                            {/* Gallery Name */}
                            <div className="form-group full-width">
                                <label>Gallery Name *</label>
                                <input
                                    type="text"
                                    name="gallery_name"
                                    value={form.gallery_name}
                                    onChange={handleChange}
                                    placeholder="e.g., Impressionist Wing"
                                    className={errors.gallery_name ? "error" : ""}
                                />
                                {errors.gallery_name && (
                                    <span className="error-message">{errors.gallery_name}</span>
                                )}
                            </div>

                            <div className="form-row">
                                {/* Floor Number */}
                                <div className="form-group">
                                    <label>Floor Number *</label>
                                    <input
                                        type="number"
                                        name="floor_number"
                                        value={form.floor_number}
                                        onChange={handleChange}
                                        placeholder="e.g., 2"
                                        className={errors.floor_number ? "error" : ""}
                                    />
                                    {errors.floor_number && (
                                        <span className="error-message">{errors.floor_number}</span>
                                    )}
                                </div>

                                {/* Square Footage */}
                                <div className="form-group">
                                    <label>Square Footage *</label>
                                    <input
                                        type="number"
                                        name="square_footage"
                                        value={form.square_footage}
                                        onChange={handleChange}
                                        placeholder="e.g., 3500"
                                        className={errors.square_footage ? "error" : ""}
                                    />
                                    {errors.square_footage && (
                                        <span className="error-message">{errors.square_footage}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                {/* Climate Controlled */}
                                <div className="form-group">
                                    <label>Climate Controlled *</label>
                                    <select
                                        name="climate_controlled"
                                        value={form.climate_controlled}
                                        onChange={handleChange}
                                        className={errors.climate_controlled ? "error" : ""}
                                    >
                                        <option value="">Select...</option>
                                        <option value="1">Yes</option>
                                        <option value="0">No</option>
                                    </select>
                                    {errors.climate_controlled && (
                                        <span className="error-message">{errors.climate_controlled}</span>
                                    )}
                                </div>

                                {/* Building */}
                                <div className="form-group">
                                    <label>Museum Building *</label>
                                    <select
                                        name="building_id"
                                        value={form.building_id}
                                        onChange={handleChange}
                                        className={errors.building_id ? "error" : ""}
                                    >
                                        <option value="">Select Building</option>
                                        {buildings.map((building) => (
                                            <option key={building.building_id} value={building.building_id}>
                                                {building.building_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.building_id && (
                                        <span className="error-message">{errors.building_id}</span>
                                    )}
                                </div>
                            </div>

                            {/* Exhibitions Multi-Select */}
                            <div className="form-group full-width">
                                <label>Exhibitions in this Gallery</label>
                                <p className="field-hint">
                                    Select all exhibitions currently displayed in this gallery.
                                </p>
                                {exhibitions.length === 0 ? (
                                    <p className="empty-hint">No exhibitions found in the database.</p>
                                ) : (
                                    <div className="checkbox-list">
                                        {exhibitions.map((exhibition) => {
                                            const checked = form.exhibition_ids
                                                .map(String)
                                                .includes(String(exhibition.exhibition_id));
                                            return (
                                                <label key={exhibition.exhibition_id} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => handleExhibitionToggle(exhibition.exhibition_id)}
                                                    />
                                                    <span className="checkbox-label">
                                                        <span className="exhibition-name">
                                                            {exhibition.exhibition_name}
                                                        </span>
                                                        {exhibition.start_date && exhibition.end_date && (
                                                            <span className="exhibition-dates">
                                                                {new Date(exhibition.start_date).toLocaleDateString()} –{" "}
                                                                {new Date(exhibition.end_date).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {errors.submit && (
                            <div className="error-message submit-error">{errors.submit}</div>
                        )}

                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={onCancel}>
                                Cancel
                            </button>
                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting
                                    ? "Saving..."
                                    : initialData
                                        ? "Update Gallery"
                                        : "Add Gallery"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}