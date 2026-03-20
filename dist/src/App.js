"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const authorizationReleaseStep_1 = __importDefault(require("../../steps/authorizationReleaseStep"));
const button_1 = __importDefault(require("@/app/components/button"));
const lucide_react_1 = require("lucide-react");
const pa_requests_1 = require("@/api/pa-requests");
const react_router_dom_1 = require("react-router-dom");
require("sweetalert2/dist/sweetalert2.min.css");
const reviewDetails_1 = __importDefault(require("../../steps/reviewDetails"));
const requestorInformationStep_1 = __importDefault(require("../../steps/requestorInformationStep"));
const patientInformationStep_1 = __importDefault(require("../../steps/patientInformationStep"));
const prescriberInformationStep_1 = __importDefault(require("../../steps/prescriberInformationStep"));
const renderingProviderInformationStep_1 = __importDefault(require("../../steps/renderingProviderInformationStep"));
const prescriptionInformationStep_1 = __importDefault(require("../../steps/prescriptionInformationStep"));
const clinicalInformationStep_1 = __importDefault(require("../../steps/clinicalInformationStep"));
const payerInformationStep_1 = __importDefault(require("../../steps/payerInformationStep"));
const medicalNecessityLetterStep_1 = __importDefault(require("../../steps/medicalNecessityLetterStep"));
const PatientContext_1 = require("@/app/contexts/PatientContext");
const pharmacist_header_1 = __importDefault(require("@/app/components/pharmacist-header"));
const SuccessModal_1 = __importDefault(require("@/app/components/modal/SuccessModal"));
const sweetalert2_1 = __importDefault(require("sweetalert2"));
// Maps change_request categories to their corresponding stepper step numbers
const CATEGORY_TO_STEP = {
    'Requestor': 1,
    'Request': 1,
    'Requestor Information': 1,
    'Patient': 2,
    'Patient Demographics': 2,
    'Payer': 3,
    'Payer Information': 3,
    'Insurance': 3,
    'Prescriber': 4,
    'Prescriber Information': 4,
    'Provider': 5,
    'Rendering Provider': 5,
    'Provider Information': 5,
    'Prescription': 6,
    'Prescription Details': 6,
    'Medication': 6,
    'Dosage': 6,
    'Dosage/Drugs': 6,
    'Diagnosis': 6,
    'Drug': 6,
    'Attachments': 7,
    'Clinical': 7,
    'Clinical Information': 7,
    'Documents': 7,
    'Medical Necessity': 8,
    'Letter': 8,
    'Signature': 9,
    'Authorization': 9,
    'Review & Sign': 9,
};
function mapCategoriesToSteps(changeRequests) {
    const steps = new Set();
    for (const cr of changeRequests) {
        const step = CATEGORY_TO_STEP[cr.category];
        if (step) {
            steps.add(step);
        }
        else {
            // Fallback: try case-insensitive match
            const key = Object.keys(CATEGORY_TO_STEP).find(k => k.toLowerCase() === cr.category.toLowerCase());
            if (key)
                steps.add(CATEGORY_TO_STEP[key]);
        }
    }
    return steps;
}
const normalizeDrugNdcArray = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item ?? '').trim())
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }
    return [];
};
const PriorAuthorizationPage = () => {
    const { id: requestId } = (0, react_router_dom_1.useParams)();
    const isEditMode = requestId ? /^\d+$/.test(requestId) : false;
    const [loading, setLoading] = (0, react_1.useState)(isEditMode);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [searchParams, setSearchParams] = (0, react_router_dom_1.useSearchParams)();
    const { patient } = (0, PatientContext_1.usePatient)();
    const storageKey = `pa_request_${requestId}`;
    const [formData, setFormData] = (0, react_1.useState)(() => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                return parsed.formData || {};
            }
            catch (e) {
                console.error("Error parsing saved form data:", e);
                return {};
            }
        }
        return {};
    });
    const [highestCompletedStep, setHighestCompletedStep] = (0, react_1.useState)(() => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                return parsed.highestCompletedStep || 0;
            }
            catch (e) {
                console.error("Error parsing saved highest completed step:", e);
                return 0;
            }
        }
        return 0;
    });
    const [steps, setSteps] = (0, react_1.useState)([
        { id: 1, label: 'Requestor Information', completed: false, active: true, icon: 'user' },
        { id: 2, label: 'Patient Demographics', completed: false, active: false, icon: 'patient' },
        { id: 3, label: 'Payer Information', completed: false, active: false, icon: 'insurance' },
        { id: 4, label: 'Prescriber Information', completed: false, active: false, icon: 'doctor' },
        { id: 5, label: 'Provider Information', completed: false, active: false, icon: 'facility' },
        { id: 6, label: 'Prescription Details', completed: false, active: false, icon: 'prescription' },
        { id: 7, label: 'Clinical Information', completed: false, active: false, icon: 'clipboard-list' },
        { id: 8, label: 'Letter Of Medical Necessity', completed: false, active: false, icon: 'vote' },
        { id: 9, label: 'Review & Sign', completed: false, active: false, icon: 'shield-check' },
        { id: 10, label: 'Review & Submit', completed: false, active: false, icon: 'shield-check' },
    ]);
    const [activeStep, setActiveStep] = (0, react_1.useState)(() => {
        const stepParam = searchParams.get('step');
        const step = stepParam ? parseInt(stepParam, 10) : 1;
        return isNaN(step) || step < 1 || step > 10 ? 1 : step;
    });
    const [, setShowConfetti] = (0, react_1.useState)(false);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [formErrors, setFormErrors] = (0, react_1.useState)({});
    const [showSuccessModal, setShowSuccessModal] = (0, react_1.useState)(false);
    const [requestedInfo, setRequestedInfo] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const completedSteps = steps.filter(step => step.completed).length;
        const progressPercentage = Math.round((completedSteps / steps.length) * 100);
        setProgress(progressPercentage);
    }, [steps]);
    // Persist form data and progress to localStorage
    (0, react_1.useEffect)(() => {
        if (requestId) {
            localStorage.setItem(storageKey, JSON.stringify({
                formData,
                highestCompletedStep
            }));
        }
    }, [formData, highestCompletedStep, requestId, storageKey]);
    (0, react_1.useEffect)(() => {
        const fetchExistingData = async () => {
            if (isEditMode && requestId) {
                try {
                    setLoading(true);
                    const existingRequest = await (0, pa_requests_1.getPARequestForDetails)(requestId);
                    // Map API response to formData structure
                    const existingDrugNdcs = normalizeDrugNdcArray(existingRequest.drug_ndc);
                    const primaryDrugNdc = existingDrugNdcs[0] || '';
                    const mappedData = {
                        urgencyType: existingRequest.urgency_type,
                        paPriorityIndicator: existingRequest.pa_priority_indicator,
                        paBuyAndBillIndicator: existingRequest.pa_buy_and_bill_indicator,
                        paRequestTiming: existingRequest.pa_request_timing,
                        drugAdministeredLocation: existingRequest.drug_administered_location,
                        billableHcpcsCode: existingRequest.billable_hcpcs_code,
                        unitsBilled: existingRequest.units_billed?.toString(),
                        numberOfVisits: existingRequest.number_of_visits?.toString(),
                        numberOfDosages: existingRequest.number_of_dosages?.toString(),
                        heightInInches: existingRequest.height_in_inches?.toString(),
                        weightInPounds: existingRequest.weight_in_pounds?.toString(),
                        medicalNecessityReason: existingRequest.medical_necessity_reason,
                        ancillaryServiceCode: existingRequest.ancillary_service_code,
                        ancillaryServiceType: existingRequest.ancillary_service_type,
                        renderingProviderNpi: existingRequest.rendering_provider_npi,
                        rendering_provider_npi_validated: !!existingRequest.rendering_provider_npi,
                        renderingProviderTin: existingRequest.rendering_provider_tin,
                        renderingProviderFacilityName: existingRequest.rendering_provider_facility_name,
                        renderingProviderFacilityType: existingRequest.rendering_provider_facility_type,
                        renderingProviderFirstName: existingRequest.rendering_provider_first_name,
                        renderingProviderLastName: existingRequest.rendering_provider_last_name,
                        renderingProviderAddress1: existingRequest.rendering_provider_address1,
                        renderingProviderAddress2: existingRequest.rendering_provider_address2,
                        renderingProviderCity: existingRequest.rendering_provider_city,
                        renderingProviderState: existingRequest.rendering_provider_state,
                        renderingProviderZip: existingRequest.rendering_provider_zip,
                        renderingProviderCountryCode: existingRequest.rendering_provider_country_code,
                        renderingProviderPhone: existingRequest.rendering_provider_phone,
                        renderingProviderFax: existingRequest.rendering_provider_fax,
                        benefitsCoordinationCardholderId: existingRequest.benefits_coordination_cardholder_id,
                        benefitsCoordinationPbmMemberId: existingRequest.benefits_coordination_pbm_member_id,
                        benefitsCoordinationPrimaryPayerName: existingRequest.benefits_coordination_primary_payer_name,
                        benefitsCoordinationPrimaryPayerPolicyNumber: existingRequest.benefits_coordination_primary_payer_policy_number,
                        benefitsCoordinationSecondaryPayerName: existingRequest.benefits_coordination_secondary_payer_name,
                        benefitsCoordinationSecondaryPayerPolicyNumber: existingRequest.benefits_coordination_secondary_payer_policy_number,
                        patientFirstName: existingRequest.patient_first_name,
                        patientLastName: existingRequest.patient_last_name,
                        patientDob: existingRequest.patient_dob,
                        patientGender: existingRequest.patient_gender,
                        patientPhone: existingRequest.patient_phone,
                        patientAddress1: existingRequest.patient_address1,
                        patientAddress2: existingRequest.patient_address2,
                        patientCity: existingRequest.patient_city,
                        patientState: existingRequest.patient_state,
                        patientZipCode: existingRequest.patient_zip_code,
                        patientCountryCode: existingRequest.patient_country_code,
                        prescriberNpi: existingRequest.prescriber_npi,
                        prescriberNpiValidated: !!existingRequest.prescriber_npi,
                        prescriberFirstName: existingRequest.prescriber_first_name,
                        prescriberLastName: existingRequest.prescriber_last_name,
                        prescriberEmail: existingRequest.prescriber_email,
                        prescriberAddress1: existingRequest.prescriber_address1,
                        prescriberAddress2: existingRequest.prescriber_address2,
                        prescriberCity: existingRequest.prescriber_city,
                        prescriberState: existingRequest.prescriber_state,
                        prescriberZip: existingRequest.prescriber_zip,
                        prescriberCountryCode: existingRequest.prescriber_country_code,
                        prescriberPhone: existingRequest.prescriber_phone,
                        prescriberFax: existingRequest.prescriber_fax,
                        prescriberDocumentDelivery: existingRequest.prescriber_document_delivery,
                        primaryDiagnosisCode: existingRequest.primary_diagnosis_code,
                        primaryDiagnosisDescription: existingRequest.primary_diagnosis_description,
                        secondaryDiagnosisCode: existingRequest.secondary_diagnosis_code,
                        secondaryDiagnosisDescription: existingRequest.secondary_diagnosis_description,
                        diagnosisClinicalInformationQualifier: existingRequest.diagnosis_clinical_information_qualifier,
                        otherMedicationDates: existingRequest.other_medication_dates,
                        drugCodedQualifier: existingRequest.drug_coded_qualifier,
                        quantityCodelistQualifier: existingRequest.quantity_codelist_qualifier,
                        quantityUnitOfMeasureCode: existingRequest.quantity_unit_of_measure_code,
                        ndcLineItems: existingRequest.ndc_line_items && existingRequest.ndc_line_items.length > 0
                            ? existingRequest.ndc_line_items.map((item) => ({
                                id: `ndc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                ndcId: item.ndc_id,
                                ndcNumber: item.ndc_number,
                                drugName: item.drug_name,
                                hcpcsCode: item.hcpcs_code,
                                drugQuantity: item.drug_quantity,
                                unitOfMeasure: item.unit_of_measure,
                                billingUnits: item.billing_units,
                                ndcCount: item.ndc_count,
                                totalQuantity: item.total_quantity,
                                totalBillingUnits: item.total_billing_units,
                            }))
                            : (existingDrugNdcs.length > 0 || existingRequest.drug_name)
                                ? [{
                                        id: `ndc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        ndcId: null,
                                        ndcNumber: primaryDrugNdc,
                                        drugName: existingRequest.drug_name || '',
                                        hcpcsCode: existingRequest.billable_hcpcs_code || '',
                                        drugQuantity: parseFloat(existingRequest.drug_quantity) || 0,
                                        unitOfMeasure: existingRequest.quantity_unit_of_measure_code || '',
                                        billingUnits: existingRequest.units_billed || 0,
                                        ndcCount: 1,
                                        totalQuantity: parseFloat(existingRequest.drug_quantity) || 0,
                                        totalBillingUnits: existingRequest.units_billed || 0,
                                        strength: '',
                                    }]
                                : [],
                        drugDaysSupply: existingRequest.drug_days_supply,
                        drugDirections: existingRequest.drug_directions,
                        drugName: existingRequest.drug_name,
                        drugNdc: primaryDrugNdc,
                        drugFrequency: existingRequest.frequency || existingRequest.drug_frequency,
                        durationOfTherapy: existingRequest.duration_of_therapy,
                        numberOfInfusions: existingRequest.number_of_infusions?.toString(),
                        selectedDrugId: existingRequest.selected_drug_id,
                        paRequestForDrugOnly: existingRequest.pa_request_for_drug_only || existingRequest.request_type,
                        nursingHoursPerDay: existingRequest.nursing_hours_per_day != null
                            ? String(existingRequest.nursing_hours_per_day)
                            : existingRequest.nursing_hours_per_visit != null
                                ? String(existingRequest.nursing_hours_per_visit)
                                : existingRequest.total_nursing_hours_per_visit != null
                                    ? String(existingRequest.total_nursing_hours_per_visit)
                                    : '',
                        prescriberTin: existingRequest.prescriber_tin,
                        healthcareProviderSignature: existingRequest.provider_signature,
                        signdate: existingRequest.signature_date,
                        // Flags
                        hasSecondaryPayer: existingRequest.has_secondary_payer || (existingRequest.benefits_coordination_secondary_payer_name ? 'yes' : 'no'),
                        insuranceType: existingRequest.insurance_type || 'primary',
                        relationToPrimaryPayer: existingRequest.relation_to_primary_payer,
                        renderingProviderNpiValidated: !!existingRequest.rendering_provider_npi,
                        providerIsPharmacist: existingRequest.provider_is_pharmacist || false,
                        // Existing documents mapping
                        prescriptionDocument: existingRequest.attachments?.find((a) => a.section === 'Prescription Document') || existingRequest.documents?.find((d) => d.section === 'Prescription Document') ? 'existing' : null,
                        prescriptionDocumentFileName: existingRequest.attachments?.find((a) => a.section === 'Prescription Document')?.filename || existingRequest.documents?.find((d) => d.section === 'Prescription Document')?.filename || '',
                        clinicalDocuments: existingRequest.attachments?.find((a) => a.section === 'Clinical Documents') || existingRequest.documents?.find((d) => d.section === 'Clinical Documents') ? 'existing' : null,
                        clinicalDocumentsFileName: existingRequest.attachments?.find((a) => a.section === 'Clinical Documents')?.filename || existingRequest.documents?.find((d) => d.section === 'Clinical Documents')?.filename || '',
                        emrExport: existingRequest.attachments?.find((a) => a.section === 'EMR Exports') || existingRequest.documents?.find((d) => d.section === 'EMR Exports') ? 'existing' : null,
                        emrExportFileName: existingRequest.attachments?.find((a) => a.section === 'EMR Exports')?.filename || existingRequest.documents?.find((d) => d.section === 'EMR Exports')?.filename || '',
                        labResults: existingRequest.attachments?.find((a) => a.section === 'Lab Results') || existingRequest.documents?.find((d) => d.section === 'Lab Results') ? 'existing' : null,
                        labResultsFileName: existingRequest.attachments?.find((a) => a.section === 'Lab Results')?.filename || existingRequest.documents?.find((d) => d.section === 'Lab Results')?.filename || '',
                        chartNotes: existingRequest.attachments?.find((a) => a.section === 'Chart Notes') || existingRequest.documents?.find((d) => d.section === 'Chart Notes') ? 'existing' : null,
                        chartNotesFileName: existingRequest.attachments?.find((a) => a.section === 'Chart Notes')?.filename || existingRequest.documents?.find((d) => d.section === 'Chart Notes')?.filename || '',
                        otherDocumentation: existingRequest.attachments?.find((a) => a.section === 'Other Documentation') || existingRequest.documents?.find((d) => d.section === 'Other Documentation') ? 'existing' : null,
                        otherDocumentationFileName: existingRequest.attachments?.find((a) => a.section === 'Other Documentation')?.filename || existingRequest.documents?.find((d) => d.section === 'Other Documentation')?.filename || '',
                        insuranceCard: existingRequest.attachments?.find((a) => a.section === 'Insurance Card') || existingRequest.documents?.find((d) => d.section === 'Insurance Card') ? 'existing' : null,
                        insuranceCardFileName: existingRequest.attachments?.find((a) => a.section === 'Insurance Card')?.filename || existingRequest.documents?.find((d) => d.section === 'Insurance Card')?.filename || '',
                        secondaryInsuranceCard: existingRequest.attachments?.find((a) => a.section === 'Secondary Insurance Card') || existingRequest.documents?.find((d) => d.section === 'Secondary Insurance Card') ? 'existing' : null,
                        secondaryInsuranceCardFileName: existingRequest.attachments?.find((a) => a.section === 'Secondary Insurance Card')?.filename || existingRequest.documents?.find((d) => d.section === 'Secondary Insurance Card')?.filename || '',
                    };
                    if (existingRequest.more_info_reason) {
                        try {
                            // Handle both string and object formats
                            let moreInfo = null;
                            if (typeof existingRequest.more_info_reason === 'string') {
                                try {
                                    moreInfo = JSON.parse(existingRequest.more_info_reason);
                                }
                                catch {
                                    // Legacy plain text reason - treat as no structured change requests
                                    console.log("more_info_reason is plain text:", existingRequest.more_info_reason);
                                }
                            }
                            else if (typeof existingRequest.more_info_reason === 'object') {
                                moreInfo = existingRequest.more_info_reason;
                            }
                            // Unwrap nested text: backend may wrap the payload inside the text field
                            if (moreInfo) {
                                let inner = moreInfo.text;
                                if (typeof inner === 'string') {
                                    try {
                                        inner = JSON.parse(inner);
                                    }
                                    catch {
                                        inner = null;
                                    }
                                }
                                if (inner && typeof inner === 'object' && inner.change_requests) {
                                    const changeReqs = Array.isArray(inner.change_requests)
                                        ? inner.change_requests
                                        : Object.values(inner.change_requests);
                                    moreInfo = { text: inner.text ?? null, change_requests: changeReqs, documents: inner.documents || [] };
                                }
                                // Normalize change_requests from object with numeric keys to array
                                if (moreInfo.change_requests && !Array.isArray(moreInfo.change_requests) && typeof moreInfo.change_requests === 'object') {
                                    moreInfo.change_requests = Object.values(moreInfo.change_requests);
                                }
                            }
                            if (moreInfo && moreInfo.change_requests && moreInfo.change_requests.length > 0) {
                                const editableSteps = mapCategoriesToSteps(moreInfo.change_requests);
                                setRequestedInfo({
                                    changeRequests: moreInfo.change_requests,
                                    editableSteps,
                                });
                                // Mark all steps up to 10 as completed so user can freely navigate
                                setHighestCompletedStep(10);
                                setSteps(prevSteps => prevSteps.map(step => ({
                                    ...step,
                                    completed: true,
                                    active: false,
                                })));
                                // Jump to first editable step
                                const sortedEditableSteps = Array.from(editableSteps).sort((a, b) => a - b);
                                const firstEditableStep = sortedEditableSteps[0] || 1;
                                if (!searchParams.get('step')) {
                                    setActiveStep(firstEditableStep);
                                    setSearchParams({ step: firstEditableStep.toString() });
                                }
                            }
                        }
                        catch (e) {
                            console.error("Error parsing more_info_reason:", e);
                        }
                    }
                    setFormData(mappedData);
                }
                catch (error) {
                    console.error("Error fetching existing PA request:", error);
                    sweetalert2_1.default.fire({
                        title: 'Error',
                        text: 'Failed to load existing PA request data.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
                }
                finally {
                    setLoading(false);
                }
            }
        };
        fetchExistingData();
    }, [requestId, isEditMode]);
    (0, react_1.useEffect)(() => {
        const stepParam = searchParams.get('step');
        const requestedStep = stepParam ? parseInt(stepParam, 10) : 1;
        // In more-info mode, allow access to any step freely
        if (requestedInfo)
            return;
        // If user tries to access a step higher than allowed, redirect to the highest allowed step
        if (requestedStep > highestCompletedStep + 1) {
            setActiveStep(highestCompletedStep + 1);
            setSearchParams({ step: (highestCompletedStep + 1).toString() });
        }
    }, [searchParams, highestCompletedStep, setSearchParams]);
    (0, react_1.useEffect)(() => {
        setSearchParams({ step: activeStep.toString() });
    }, [activeStep, setSearchParams]);
    (0, react_1.useEffect)(() => {
        setSteps(prevSteps => prevSteps.map(step => ({
            ...step,
            active: step.id === activeStep,
            completed: step.id < activeStep
        })));
        // Update highest completed step
        if (activeStep > highestCompletedStep + 1) {
            setHighestCompletedStep(activeStep - 1);
        }
    }, [activeStep]);
    const updateFormData = (newData) => {
        setFormData((prev) => ({
            ...prev,
            ...newData
        }));
    };
    const validateRequestorInformation = (data) => {
        const errors = {};
        if (!data.urgencyType?.trim()) {
            errors.urgencyType = 'Urgency type is required.';
        }
        if (!data.paPriorityIndicator?.trim()) {
            errors.paPriorityIndicator = 'Priority indicator is required.';
        }
        if (!data.paRequestTiming?.trim()) {
            errors.paRequestTiming = 'Request timing is required.';
        }
        return errors;
    };
    const validatePatientInformation = (data) => {
        const errors = {};
        if (!data.patientFirstName?.trim()) {
            errors.patientFirstName = 'Patient first name is required.';
        }
        if (!data.patientLastName?.trim()) {
            errors.patientLastName = 'Patient last name is required.';
        }
        if (!data.patientDob?.trim()) {
            errors.patientDob = 'Date of birth is required.';
        }
        if (!data.patientGender?.trim()) {
            errors.patientGender = 'Gender is required.';
        }
        if (!data.patientPhone?.trim()) {
            errors.patientPhone = 'Phone number is required.';
        }
        if (!data.patientAddress1?.trim()) {
            errors.patientAddress1 = 'Address is required.';
        }
        if (!data.patientCity?.trim()) {
            errors.patientCity = 'City is required.';
        }
        if (!data.patientState?.trim()) {
            errors.patientState = 'State is required.';
        }
        if (!data.patientZipCode?.trim()) {
            errors.patientZipCode = 'ZIP code is required.';
        }
        return errors;
    };
    const validatePrescriberInformation = (data) => {
        const errors = {};
        if (!data.prescriberFirstName?.trim()) {
            errors.prescriberFirstName = 'Prescriber first name is required.';
        }
        if (!data.prescriberLastName?.trim()) {
            errors.prescriberLastName = 'Prescriber last name is required.';
        }
        if (!data.prescriberNpi?.trim()) {
            errors.prescriberNpi = 'Prescriber NPI is required.';
        }
        else if (data.prescriberNpi.replace(/\D/g, '').length !== 10) {
            errors.prescriberNpi = 'NPI must be 10 digits.';
        }
        else if (!data.prescriberNpiValidated) {
            errors.prescriberNpi = 'NPI must be verified. Please enter a valid NPI that exists in the NPI Registry.';
        }
        if (!data.prescriberEmail?.trim()) {
            errors.prescriberEmail = 'Prescriber email is required.';
        }
        else if (!/^\S+@\S+\.\S+$/.test(data.prescriberEmail)) {
            errors.prescriberEmail = 'Invalid email format.';
        }
        if (!data.prescriberPhone?.trim()) {
            errors.prescriberPhone = 'Prescriber phone is required.';
        }
        // FAX validation - must be 10 digits
        if (!data.prescriberFax?.trim()) {
            errors.prescriberFax = 'Prescriber fax is required.';
        }
        else {
            const faxDigits = data.prescriberFax.replace(/\D/g, '');
            if (faxDigits.length < 10) {
                errors.prescriberFax = 'FAX number must be at least 10 digits.';
            }
        }
        if (!data.prescriberAddress1?.trim()) {
            errors.prescriberAddress1 = 'Prescriber address is required.';
        }
        if (!data.prescriberCity?.trim()) {
            errors.prescriberCity = 'City is required.';
        }
        if (!data.prescriberState?.trim()) {
            errors.prescriberState = 'State is required.';
        }
        if (!data.prescriberZip?.trim()) {
            errors.prescriberZip = 'ZIP code is required.';
        }
        if (!data.prescriberCountryCode?.trim()) {
            errors.prescriberCountryCode = 'Country code is required.';
        }
        if (!data.prescriberDocumentDelivery) {
            errors.prescriberDocumentDelivery = 'Please select a document delivery preference.';
        }
        return errors;
    };
    const validateRenderingProviderInformation = (data) => {
        const errors = {};
        // If pharmacist checkbox is checked, skip validation
        if (data.providerIsPharmacist) {
            return errors;
        }
        if (!data.renderingProviderFirstName?.trim()) {
            errors.renderingProviderFirstName = 'Provider first name is required.';
        }
        if (!data.renderingProviderLastName?.trim()) {
            errors.renderingProviderLastName = 'Provider last name is required.';
        }
        if (!data.renderingProviderNpi?.trim()) {
            errors.renderingProviderNpi = 'Provider NPI is required.';
        }
        else if (data.renderingProviderNpi.replace(/\D/g, '').length !== 10) {
            errors.renderingProviderNpi = 'NPI must be 10 digits.';
        }
        else if (!data.renderingProviderNpiValidated) {
            errors.renderingProviderNpi = 'NPI must be verified. Please enter a valid NPI that exists in the NPI Registry.';
        }
        if (!data.renderingProviderTin?.trim()) {
            errors.renderingProviderTin = 'Provider TIN is required.';
        }
        if (!data.renderingProviderFacilityName?.trim()) {
            errors.renderingProviderFacilityName = 'Facility name is required.';
        }
        if (!data.renderingProviderFacilityType?.trim()) {
            errors.renderingProviderFacilityType = 'Facility type is required.';
        }
        if (!data.renderingProviderPhone?.trim()) {
            errors.renderingProviderPhone = 'Provider phone is required.';
        }
        if (!data.renderingProviderFax?.trim()) {
            errors.renderingProviderFax = 'Provider fax is required.';
        }
        if (!data.renderingProviderAddress1?.trim()) {
            errors.renderingProviderAddress1 = 'Provider address is required.';
        }
        if (!data.renderingProviderCity?.trim()) {
            errors.renderingProviderCity = 'City is required.';
        }
        if (!data.renderingProviderState?.trim()) {
            errors.renderingProviderState = 'State is required.';
        }
        if (!data.renderingProviderZip?.trim()) {
            errors.renderingProviderZip = 'ZIP code is required.';
        }
        if (!data.renderingProviderCountryCode?.trim()) {
            errors.renderingProviderCountryCode = 'Country code is required.';
        }
        return errors;
    };
    const validatePrescriptionInformation = (data) => {
        const errors = {};
        // Validate that at least one drug with NDCs is added
        if (!data.ndcLineItems || data.ndcLineItems.length === 0) {
            errors.drugNdc = 'At least one drug with NDC selection is required.';
        }
        if (!data.drugDaysSupply) {
            errors.drugDaysSupply = 'Days supply is required.';
        }
        if (!data.drugDirections?.trim()) {
            errors.drugDirections = 'Drug directions are required.';
        }
        if (!data.drugAdministeredLocation?.trim()) {
            errors.drugAdministeredLocation = 'Drug administered location is required.';
        }
        if (!data.primaryDiagnosisCode?.trim()) {
            errors.primaryDiagnosisCode = 'Primary diagnosis code is required.';
        }
        if (!data.primaryDiagnosisDescription?.trim()) {
            errors.primaryDiagnosisDescription = 'Primary diagnosis description is required.';
        }
        if (!data.heightInInches) {
            errors.heightInInches = 'Height is required.';
        }
        if (!data.weightInPounds) {
            errors.weightInPounds = 'Weight is required.';
        }
        if (!data.drugFrequency?.trim()) {
            errors.drugFrequency = 'Frequency is required.';
        }
        if (!data.durationOfTherapy?.trim()) {
            errors.durationOfTherapy = 'Duration of therapy is required.';
        }
        // In edit mode, the document was already submitted, so don't require re-upload
        if (!isEditMode && !data.prescriptionDocument) {
            errors.prescriptionDocument = 'Prescription document is required.';
        }
        return errors;
    };
    const validateClinicalInformation = (_data) => {
        const errors = {};
        // medicalNecessityReason is optional
        return errors;
    };
    const validatePayerInformation = (data) => {
        const errors = {};
        if (!data.benefitsCoordinationCardholderId?.trim()) {
            errors.benefitsCoordinationCardholderId = 'Cardholder ID is required.';
        }
        if (!data.benefitsCoordinationPrimaryPayerName?.trim()) {
            errors.benefitsCoordinationPrimaryPayerName = 'Primary payer name is required.';
        }
        if (!data.benefitsCoordinationPrimaryPayerPolicyNumber?.trim()) {
            errors.benefitsCoordinationPrimaryPayerPolicyNumber = 'Policy number is required.';
        }
        // Secondary payer selection is required
        if (!data.hasSecondaryPayer) {
            errors.hasSecondaryPayer = 'Please select whether the patient has a secondary payer.';
        }
        if (!data.insuranceType) {
            errors.insuranceType = 'Please select whether you are primary or secondary.';
        }
        return errors;
    };
    const validateAuthorizationRelease = (data) => {
        const errors = {};
        if (!data.healthcareProviderSignature) {
            errors.healthcareProviderSignature = 'Signature is required.';
        }
        if (!data.signdate) {
            errors.signdate = 'Signature date is required.';
        }
        return errors;
    };
    const validateReviewDetails = () => {
        const errors = {};
        // No validation required for review step
        return errors;
    };
    // Helper: check if a step is locked (not editable) in more-info mode
    const isStepLocked = (stepNumber) => {
        if (!requestedInfo)
            return false;
        return !requestedInfo.editableSteps.has(stepNumber);
    };
    // Get change requests relevant to a specific step
    const getChangeRequestsForStep = (stepNumber) => {
        if (!requestedInfo)
            return [];
        return requestedInfo.changeRequests.filter(cr => {
            const mappedStep = CATEGORY_TO_STEP[cr.category] ??
                CATEGORY_TO_STEP[Object.keys(CATEGORY_TO_STEP).find(k => k.toLowerCase() === cr.category.toLowerCase()) || ''];
            return mappedStep === stepNumber;
        });
    };
    const handleNext = () => {
        // Skip validation for locked steps in more-info mode
        const stepLocked = isStepLocked(activeStep);
        // Validation
        let errors = {};
        console.log("Current activeStep:", activeStep);
        console.log("Current formData:", formData);
        if (!stepLocked) {
            switch (activeStep) {
                case 1:
                    errors = validateRequestorInformation(formData);
                    break;
                case 2:
                    errors = validatePatientInformation(formData);
                    break;
                case 3:
                    errors = validatePayerInformation(formData);
                    break;
                case 4:
                    errors = validatePrescriberInformation(formData);
                    break;
                case 5:
                    errors = validateRenderingProviderInformation(formData);
                    break;
                case 6:
                    errors = validatePrescriptionInformation(formData);
                    break;
                case 7:
                    errors = validateClinicalInformation(formData);
                    break;
                case 8:
                    errors = {}; // No validation for letter step
                    break;
                case 9:
                    errors = validateAuthorizationRelease(formData);
                    break;
                case 10:
                    errors = validateReviewDetails();
                    break;
            }
        }
        console.log("Validation errors:", errors);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            // Scroll to the first error for better UX
            setTimeout(() => {
                const firstErrorElement = document.querySelector('.text-red-600');
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
        // Clear errors before proceeding
        setFormErrors({});
        if (activeStep < steps.length) {
            let targetNextStep = activeStep + 1;
            if (isEditMode && requestedInfo && requestedInfo.editableSteps && requestedInfo.editableSteps.size > 0) {
                const lastEditableStep = Math.max(...Array.from(requestedInfo.editableSteps));
                if (activeStep >= lastEditableStep && activeStep < steps.length) {
                    targetNextStep = steps.length;
                }
            }
            const updatedSteps = steps.map(step => {
                if (step.id === activeStep) {
                    return { ...step, completed: true, active: false };
                }
                else if (step.id === targetNextStep) {
                    return { ...step, active: true };
                }
                return { ...step, active: false };
            });
            setSteps(updatedSteps);
            setActiveStep(targetNextStep);
            // Update highest completed step
            if (activeStep > highestCompletedStep) {
                setHighestCompletedStep(activeStep);
            }
            // Add a small delay
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 10);
        }
    };
    const handlePrevious = () => {
        if (activeStep > 1) {
            const updatedSteps = steps.map(step => {
                if (step.id === activeStep) {
                    return { ...step, active: false };
                }
                else if (step.id === activeStep - 1) {
                    return { ...step, active: true, completed: false };
                }
                return step;
            });
            setSteps(updatedSteps);
            setActiveStep(activeStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const handleSubmit = async () => {
        const errors = validateReviewDetails();
        console.log("Submit validation errors:", errors);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setTimeout(() => {
                const firstErrorElement = document.querySelector('.text-red-600');
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
        try {
            setLoading(true); // Start loading
            console.log("Form data before submission:", formData); // Debug log
            // Transform form data to match the Agadia PA request API structure
            const resolvedDrugNdcs = formData.ndcLineItems && formData.ndcLineItems.length > 0
                ? formData.ndcLineItems
                    .map((item) => String(item.ndcNumber || '').trim())
                    .filter((ndc) => Boolean(ndc))
                : normalizeDrugNdcArray(formData.drugNdc);
            const paRequestPayload = {
                pa_request: {
                    // System Fields
                    pahub_customer_name: 'Medmonk',
                    // Request Configuration
                    urgency_type: formData.urgencyType || 'Standard',
                    pa_priority_indicator: formData.paPriorityIndicator || 'No',
                    pa_buy_and_bill_indicator: formData.paBuyAndBillIndicator || 0,
                    pa_request_timing: formData.paRequestTiming || 'Initial',
                    pa_request_for_drug_only: formData.paRequestForDrugOnly,
                    request_type: formData.paRequestForDrugOnly,
                    // Drug Administration
                    drug_administered_location: formData.drugAdministeredLocation || '',
                    billable_hcpcs_code: formData.billableHcpcsCode || '',
                    units_billed: formData.unitsBilled ? parseInt(formData.unitsBilled) : (formData.ndcLineItems?.reduce((sum, item) => sum + (item.totalBillingUnits || 0), 0) || undefined),
                    number_of_visits: formData.numberOfVisits ? parseInt(formData.numberOfVisits) : 1,
                    nursing_visits: formData.numberOfVisits ? parseInt(formData.numberOfVisits) : undefined,
                    number_of_dosages: formData.numberOfDosages ? parseInt(formData.numberOfDosages) : (formData.numberOfInfusions ? parseInt(formData.numberOfInfusions) : undefined),
                    number_of_infusions: formData.numberOfInfusions ? parseInt(formData.numberOfInfusions) : undefined,
                    nursing_hours_per_day: formData.nursingHoursPerDay,
                    // Patient Vitals
                    height_in_inches: formData.heightInInches ? parseInt(formData.heightInInches) : undefined,
                    weight_in_pounds: formData.weightInPounds ? parseInt(formData.weightInPounds) : undefined,
                    // Clinical Information
                    medical_necessity_reason: formData.medicalNecessityReason || '',
                    ancillary_service_code: formData.ancillaryServiceCode || '',
                    ancillary_service_type: formData.ancillaryServiceType || '',
                    // Rendering Provider Information
                    rendering_provider_npi: formData.renderingProviderNpi?.replace(/\D/g, '') || '',
                    rendering_provider_tin: formData.renderingProviderTin || '',
                    rendering_provider_facility_name: formData.renderingProviderFacilityName || '',
                    rendering_provider_facility_type: formData.renderingProviderFacilityType || '',
                    rendering_provider_first_name: formData.renderingProviderFirstName || '',
                    rendering_provider_last_name: formData.renderingProviderLastName || '',
                    rendering_provider_address1: formData.renderingProviderAddress1 || '',
                    rendering_provider_address2: formData.renderingProviderAddress2 || '',
                    rendering_provider_city: formData.renderingProviderCity || '',
                    rendering_provider_state: formData.renderingProviderState || '',
                    rendering_provider_zip: formData.renderingProviderZip || '',
                    rendering_provider_country_code: formData.renderingProviderCountryCode || 'US',
                    rendering_provider_phone: formData.renderingProviderPhone?.replace(/\D/g, '') || '',
                    rendering_provider_fax: formData.renderingProviderFax?.replace(/\D/g, '') || '',
                    provider_is_pharmacist: formData.providerIsPharmacist,
                    // Benefits Coordination
                    benefits_coordination_cardholder_id: formData.benefitsCoordinationCardholderId || '',
                    benefits_coordination_pbm_member_id: formData.benefitsCoordinationPbmMemberId || '',
                    benefits_coordination_primary_payer_name: formData.benefitsCoordinationPrimaryPayerName || '',
                    benefits_coordination_primary_payer_policy_number: formData.benefitsCoordinationPrimaryPayerPolicyNumber || '',
                    benefits_coordination_secondary_payer_name: formData.benefitsCoordinationSecondaryPayerName || '',
                    benefits_coordination_secondary_payer_policy_number: formData.benefitsCoordinationSecondaryPayerPolicyNumber || '',
                    insurance_type: formData.insuranceType,
                    has_secondary_payer: formData.hasSecondaryPayer,
                    relation_to_primary_payer: formData.relationToPrimaryPayer,
                    // Patient Information
                    patient_first_name: formData.patientFirstName || '',
                    patient_last_name: formData.patientLastName || '',
                    patient_dob: formData.patientDob || '',
                    patient_gender: formData.patientGender || '',
                    patient_phone: formData.patientPhone?.replace(/\D/g, '') || '',
                    patient_address1: formData.patientAddress1 || '',
                    patient_address2: formData.patientAddress2 || '',
                    patient_city: formData.patientCity || '',
                    patient_state: formData.patientState || '',
                    patient_zip_code: formData.patientZipCode || '',
                    patient_country_code: formData.patientCountryCode || 'US',
                    // Prescriber Information
                    prescriber_npi: formData.prescriberNpi?.replace(/\D/g, '') || '',
                    prescriber_tin: formData.prescriberTin || '',
                    prescriber_first_name: formData.prescriberFirstName || '',
                    prescriber_last_name: formData.prescriberLastName || '',
                    prescriber_email: formData.prescriberEmail || '',
                    prescriber_address1: formData.prescriberAddress1 || '',
                    prescriber_address2: formData.prescriberAddress2 || '',
                    prescriber_city: formData.prescriberCity || '',
                    prescriber_state: formData.prescriberState || '',
                    prescriber_zip: formData.prescriberZip || '',
                    prescriber_country_code: formData.prescriberCountryCode || 'US',
                    prescriber_phone: formData.prescriberPhone?.replace(/\D/g, '') || '',
                    prescriber_fax: formData.prescriberFax?.replace(/\D/g, '') || '',
                    prescriber_document_delivery: formData.prescriberDocumentDelivery,
                    // Drug Information
                    drug_name: formData.ndcLineItems && formData.ndcLineItems.length > 0 ? formData.ndcLineItems[0].drugName : '',
                    drug_ndc: resolvedDrugNdcs,
                    drug_coded_qualifier: formData.drugCodedQualifier || 'ND',
                    drug_quantity: formData.ndcLineItems?.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)?.toString() || '',
                    total_drug_quantity: formData.ndcLineItems?.reduce((sum, item) => sum + (item.totalQuantity || 0), 0) || undefined,
                    total_billing_units: formData.ndcLineItems?.reduce((sum, item) => sum + (item.totalBillingUnits || 0), 0) || undefined,
                    quantity_codelist_qualifier: formData.quantityCodelistQualifier || 'UN',
                    quantity_unit_of_measure_code: formData.ndcLineItems?.[0]?.unitOfMeasure || '',
                    drug_days_supply: formData.drugDaysSupply || '',
                    drug_directions: formData.drugDirections || '',
                    frequency: formData.drugFrequency,
                    drug_frequency: formData.drugFrequency,
                    duration_of_therapy: formData.durationOfTherapy,
                    selected_drug_id: formData.selectedDrugId || undefined,
                    // NDC Line Items - send all drugs and their NDCs
                    ndc_line_items: formData.ndcLineItems ? formData.ndcLineItems.map((item) => ({
                        ndc_id: item.ndcId,
                        ndc_number: item.ndcNumber,
                        drug_name: item.drugName,
                        hcpcs_code: item.hcpcsCode,
                        drug_quantity: item.drugQuantity,
                        unit_of_measure: item.unitOfMeasure,
                        billing_units: item.billingUnits,
                        ndc_count: item.ndcCount,
                        total_quantity: item.totalQuantity,
                        total_billing_units: item.totalBillingUnits,
                    })) : [],
                    // Diagnosis Information
                    diagnosis_clinical_information_qualifier: formData.diagnosisClinicalInformationQualifier || 1,
                    primary_diagnosis_code: formData.primaryDiagnosisCode || '',
                    primary_diagnosis_description: formData.primaryDiagnosisDescription || '',
                    secondary_diagnosis_code: formData.secondaryDiagnosisCode || '',
                    secondary_diagnosis_description: formData.secondaryDiagnosisDescription || '',
                    // Signature
                    provider_signature: formData.healthcareProviderSignature || '',
                    signature_date: formData.signdate || '',
                    // Additional Fields
                    other_medication_dates: formData.otherMedicationDates || '[]',
                    // Document files - these will be sent directly
                    emr_export: formData.emrExport || null,
                    lab_results: formData.labResults || null,
                    chart_notes: formData.chartNotes || null,
                    other_documentation: formData.otherDocumentation || null,
                    insurance_card: formData.insuranceCard || null,
                    secondary_insurance_card: formData.secondaryInsuranceCard || null,
                    prescription_document: formData.prescriptionDocument || null,
                    clinical_documents: formData.clinicalDocuments || null,
                }
            };
            console.log("PA Request payload being sent to API:", paRequestPayload); // Debug log
            let response;
            if (isEditMode && requestId) {
                response = await (0, pa_requests_1.updatePARequest)(requestId, paRequestPayload);
            }
            else {
                response = await (0, pa_requests_1.submitPARequest)(paRequestPayload);
            }
            console.log("API Response:", response); // Debug log
            setShowConfetti(true);
            setTimeout(() => {
                setShowSuccessModal(true);
            }, 500);
        }
        catch (error) {
            console.error("Error details:", error);
            // Show detailed error message
            const errorMessage = error.message || "Failed to submit form. Please try again.";
            sweetalert2_1.default.fire({
                title: "Submission Failed",
                text: errorMessage,
                icon: "error",
                confirmButtonText: "OK",
                customClass: {
                    confirmButton: 'bg-red-600 p-5 text-white rounded-full font-semibold',
                },
                buttonsStyling: false,
            });
        }
        finally {
            setLoading(false); // Stop loading whether success or error
        }
    };
    const handleSuccessModalClose = () => {
        // Clear persisted data
        if (requestId) {
            localStorage.removeItem(storageKey);
        }
        setShowSuccessModal(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/pharmacist/dashboard');
        setShowConfetti(false);
    };
    const jumpToStep = (stepId) => {
        // In more-info mode, allow jumping to any step freely
        if (!requestedInfo) {
            const currentCompletedSteps = steps.filter(step => step.completed);
            if (stepId > currentCompletedSteps.length + 1)
                return;
        }
        const updatedSteps = steps.map(step => {
            if (step.id === activeStep) {
                return { ...step, active: false };
            }
            else if (step.id === stepId) {
                return { ...step, active: true };
            }
            return step;
        });
        setSteps(updatedSteps);
        setActiveStep(stepId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const renderStepContent = () => {
        switch (activeStep) {
            case 1:
                return <requestorInformationStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(1)} changeRequests={getChangeRequestsForStep(1)}/>;
            case 2:
                return <patientInformationStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(2)} changeRequests={getChangeRequestsForStep(2)}/>;
            case 3:
                return <payerInformationStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(3)} changeRequests={getChangeRequestsForStep(3)}/>;
            case 4:
                return <prescriberInformationStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(4)} changeRequests={getChangeRequestsForStep(4)}/>;
            case 5:
                return <renderingProviderInformationStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(5)} changeRequests={getChangeRequestsForStep(5)}/>;
            case 6:
                return <prescriptionInformationStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(6)} isEditMode={isEditMode} changeRequests={getChangeRequestsForStep(6)}/>;
            case 7:
                return <clinicalInformationStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(7)} changeRequests={getChangeRequestsForStep(7)}/>;
            case 8:
                return <medicalNecessityLetterStep_1.default formData={formData} requestId={requestId}/>;
            case 9:
                return <authorizationReleaseStep_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} setFormErrors={setFormErrors} isStepLocked={isStepLocked(9)} changeRequests={getChangeRequestsForStep(9)}/>;
            case 10:
                return <reviewDetails_1.default formData={formData} updateFormData={updateFormData} formErrors={formErrors} patient={patient}/>;
            default:
                return null;
        }
    };
    const renderIcon = (iconName) => {
        switch (iconName) {
            case 'user':
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>);
            case 'patient':
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>);
            case 'doctor':
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>);
            case 'facility':
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>);
            case 'prescription':
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>);
            case 'insurance':
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
          </svg>);
            case 'shield-check':
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>);
            case 'vote':
                return (<svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 12 2 2 4-4"/>
            <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/>
            <path d="M22 19H2"/>
          </svg>);
            case 'clipboard-list':
                return (<svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <path d="M12 11h4"/>
            <path d="M12 16h4"/>
            <path d="M8 11h.01"/>
            <path d="M8 16h.01"/>
          </svg>);
            default:
                return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>);
        }
    };
    const renderVerticalStepIndicator = () => {
        return (<div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
          <div className="relative h-10 w-10">
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" strokeDasharray="100, 100"/>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeWidth="3" strokeDasharray={`${progress}, 100`}/>
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-semibold text-indigo-800">{progress}%</div>
          </div>
        </div>

        <nav className="space-y-2" aria-label="Steps">
          {steps.map((step, index) => {
                const stepEditable = requestedInfo ? requestedInfo.editableSteps.has(step.id) : false;
                const stepLockedInMoreInfo = requestedInfo ? !requestedInfo.editableSteps.has(step.id) : false;
                return (<div key={step.id}>
                <button onClick={() => jumpToStep(step.id)} className={`w-full flex items-center p-3 rounded-lg text-left transition-all ${step.active
                        ? stepEditable
                            ? 'bg-orange-50 border-2 border-orange-400'
                            : 'bg-primary/10 border-2 border-primary'
                        : requestedInfo
                            ? stepEditable
                                ? 'bg-orange-50 border-2 border-orange-200 hover:bg-orange-100'
                                : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                            : step.completed
                                ? 'bg-green-50 border-2 border-green-200 hover:bg-green-100'
                                : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'} ${!requestedInfo && step.id > steps.filter(s => s.completed).length + 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} disabled={!requestedInfo && step.id > steps.filter(s => s.completed).length + 1}>
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${requestedInfo
                        ? stepEditable
                            ? step.active
                                ? 'bg-orange-500 text-white'
                                : 'bg-orange-400 text-white'
                            : step.active
                                ? 'bg-gray-400 text-white'
                                : 'bg-gray-300 text-gray-500'
                        : step.completed
                            ? 'bg-green-500 text-white'
                            : step.active
                                ? 'bg-primary text-white'
                                : 'bg-gray-300 text-gray-600'}`}>
                      {requestedInfo ? (stepLockedInMoreInfo ? (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                          </svg>) : (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>)) : step.completed ? (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>) : (<span className="text-sm font-semibold">{step.id}</span>)}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`text-sm font-medium ${requestedInfo
                        ? stepEditable
                            ? step.active ? 'text-orange-700' : 'text-orange-600'
                            : 'text-gray-500'
                        : step.active ? 'text-primary' : step.completed ? 'text-green-700' : 'text-gray-600'}`}>
                        {step.label}
                      </span>
                      {requestedInfo && stepEditable && (<span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full">
                          Edit Required
                        </span>)}
                      {requestedInfo && stepLockedInMoreInfo && (<span className="px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                          Locked
                        </span>)}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (<div className="ml-7 h-6 w-0.5 bg-gray-200"></div>)}
              </div>);
            })}
        </nav>
      </div>);
    };
    return (<div className="min-h-screen bg-gray-50">
      <pharmacist_header_1.default />
      <div className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Prior Authorization</h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Complete all steps to submit your prior authorization request</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="hidden lg:block lg:col-span-3">
              {renderVerticalStepIndicator()}
            </div>

            <div className="lg:col-span-9">
              <div className="bg-white rounded-lg">
                <div className="lg:hidden border-b border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-500">
                        Step {activeStep} of {steps.length}
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {steps.find(step => step.active)?.label}
                      </p>
                    </div>
                    <div className="relative h-10 w-10 flex-shrink-0">
                      <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" strokeDasharray="100, 100"/>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeWidth="3" strokeDasharray={`${progress}, 100`}/>
                      </svg>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-semibold text-indigo-800">{progress}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                {/* Step Header */}
                <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
                  <div className="flex items-start sm:items-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${activeStep === steps.length ? 'bg-emerald-500' : 'bg-primary'} text-white shadow-md flex-shrink-0`}>
                      {renderIcon(steps[activeStep - 1]?.icon || 'default')}
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                        {steps.find(step => step.active)?.label}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-gray-600">
                        {activeStep === steps.length
            ? 'Review your information before submitting'
            : 'Complete the required information to proceed'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  {isEditMode && loading ? (<div className="flex flex-col items-center justify-center py-16">
                      <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-gray-500">Loading request data...</p>
                    </div>) : (<div className="transition-all duration-300 animate-fadeIn">
                      {renderStepContent()}
                    </div>)}
                </div>

                <div className="border-t border-gray-200 px-4 sm:px-6 py-4">
                  <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <button type="button" onClick={handlePrevious} disabled={activeStep === 1} className={`w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${activeStep === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-indigo-700 border border-gray-300 shadow-sm hover:shadow'}`}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                      Previous
                    </button>

                    {activeStep === steps.length ? (<button type="button" onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary hover:from-indigo-700 hover:to-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? (<>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>) : (<>
                            {isEditMode ? 'Resubmit to Prescriber' : 'Submit Authorization Request'}
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </>)}
                      </button>) : (<button_1.default variant="solid" onClick={handleNext} icon={<lucide_react_1.ChevronRight size={20}/>}>
                        Continue to Next Step
                      </button_1.default>)}
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-4 sm:mt-6">
                <div className="flex items-start sm:items-center p-3 sm:p-4 bg-white rounded-lg">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  <p className="ml-3 text-xs sm:text-sm text-gray-600">
                    Your information is securely encrypted and transmitted in compliance with HIPAA regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to Top Button */}
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-10">
          <button className="bg-primary text-white p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll to top">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal_1.default isOpen={showSuccessModal} onClose={handleSuccessModalClose} title={isEditMode ? "Request Resubmitted!" : "Request Submitted!"} message={isEditMode ? "Your Prior Authorization request has been resubmitted successfully. You will be redirected to your dashboard." : "Your Prior Authorization request has been submitted successfully. You will be redirected to your dashboard."} buttonText="Go to Dashboard"/>
    </div>);
};
exports.default = PriorAuthorizationPage;
