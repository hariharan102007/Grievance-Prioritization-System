# Machine Learning Model & Kaggle Dataset Implementation

This module contains the dataset processing and model training pipeline for the **Citizen Grievance Redressal Portal**.

## 1. What Data is Suitable for This Project?

From any Kaggle dataset (e.g. CFPB, Citizen Grievance, Civic Complaints), we extract **ONLY** civic-relevant columns and discard unwanted financial/banking data:

| Keep (Suitable) | Discard (Unwanted) |
| :--- | :--- |
| **Complaint Description / Text Narrative** | Account numbers, SSN, Credit card numbers |
| **Issue / Sub-issue / Category** | Company Name, Financial products (mortgage, loan) |
| **Location / City / State / Ward** | Credit reporting agencies, Debt collection tags |
| **Date Submitted / Resolution Status** | Banking transaction IDs, Dispute fees |

## 2. Target Departments in Our Project:
1. **Water Supply & Drainage** (Water pipe bursts, sewage leaks, tap contamination)
2. **Electricity Department** (Power cuts, loose live wires, damaged transformers, streetlights)
3. **Roads & Infrastructure** (Potholes, broken roads, damaged footpaths, speed breakers)
4. **Sanitation & Waste Management** (Overflowing dustbins, garbage accumulation, dead animals)
5. **Public Health** (Mosquito breeding, clinic hygiene, epidemic alerts)
6. **Public Safety** (Stray dogs, broken streetlights at dark alleys, open manholes)

## 3. How to Run Training on Your Excel File:
```bash
python ml_model/train_from_excel.py your_kaggle_dataset.xlsx
```
or Google Colab.

Outputs:
* `ml_model/artifacts/grievance_model.pkl` (Trained classifier)
* `ml_model/artifacts/tfidf_vectorizer.pkl` (Feature vectorizer)
* `ml_model/artifacts/cleaned_civic_complaints.csv` (Filtered civic dataset)
