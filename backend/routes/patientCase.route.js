
import express from 'express';
import { createPatientCase, getPatientCases, getPatientCaseById, updatePatientCase } from '../controllers/patientCase.controller.js'; 

const router = express.Router();

router.post('/', createPatientCase);
router.get('/', getPatientCases); 
router.get('/:id', getPatientCaseById);
router.patch('/:id', updatePatientCase);

export default router;
