// Ai_patient_script_model.js

export const candidate_instruction = [
    /* Example:
    ""
    */

]

export const Ai_patient_script_model = {
    brief_info: {
        name_symptom:"",
        desc: "",
        topic: "", // [ History - Bệnh sử, Counselling - Tư vấn  ]
    },
    key_details: [],
    presenting_complaint: [],
    history_of_presenting_complaint: [],
    ice:[],
    past_medical_and_surgical_history: [],
    drug_history: [],
    family_history: [],
    diagnosis: ``,
    score: 10, 
}

export const Ai_assess_schema = {
    case: '',
    data_gathering: {
        score: '',
        covered: [],
        partially_covered: [],
        missed: [],
    },
    management: {
        score: '',
        covered: [],
        partially_covered: [],
        missed: [],
    },
    interpersonal_skills: {
        score: '',
        covered: [],
        partially_covered: [],
        missed: [],
    },
    feedback: {
        need_improvement: [],
        good: [],
    }
}