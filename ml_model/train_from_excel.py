"""
Citizen Grievance Machine Learning Training Pipeline
=====================================================
This script processes the Kaggle Excel/CSV dataset, filters only the relevant
columns suitable for civic grievance management, discards unwanted fields,
and trains an NLP classification model (TF-IDF + Classifier).
"""

import os
import sys
import pandas as pd
import numpy as np

# ML Libraries
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib

# 1. ALLOWED / SUITABLE DEPARTMENTS IN OUR CIVIC SYSTEM
VALID_CIVIC_DEPARTMENTS = {
    'Water Supply': ['water', 'pipe', 'leak', 'drainage', 'sewage', 'tank', 'drinking water', 'tap'],
    'Electricity': ['power', 'electric', 'wire', 'streetlight', 'transformer', 'voltage', 'blackout'],
    'Roads': ['road', 'pothole', 'street', 'pavement', 'traffic', 'footpath', 'highway', 'tar'],
    'Sanitation': ['garbage', 'waste', 'trash', 'dustbin', 'dump', 'smell', 'mosquito', 'debris'],
    'Healthcare': ['hospital', 'clinic', 'doctor', 'medicine', 'dengue', 'health', 'ambulance'],
    'Public Safety': ['police', 'stray dog', 'theft', 'hazard', 'safety', 'lights']
}

def identify_relevant_columns(df):
    """
    Identifies the complaint text column and the category/department column
    regardless of whether the Excel uses 'Description', 'Complaint_Text', 'Issue', etc.
    """
    text_candidates = ['complaint_text', 'complaint', 'description', 'issue_description', 
                       'narrative', 'consumer_complaint_narrative', 'details', 'problem', 'text']
    category_candidates = ['category', 'department', 'product', 'sub_product', 
                           'issue', 'sub_issue', 'grievance_type', 'type', 'dept']
    
    text_col = None
    cat_col = None
    
    col_map = {str(c).lower().strip().replace(' ', '_'): c for c in df.columns}
    
    for candidate in text_candidates:
        if candidate in col_map:
            text_col = col_map[candidate]
            break
            
    for candidate in category_candidates:
        if candidate in col_map:
            cat_col = col_map[candidate]
            break
            
    return text_col, cat_col

def filter_suitable_dataset(file_path):
    """
    Loads Excel or CSV, removes unwanted data, and keeps only suitable civic records.
    """
    print(f"[*] Reading dataset from: {file_path}")
    if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
        df = pd.read_excel(file_path)
    else:
        df = pd.read_csv(file_path)
        
    print(f"[*] Total rows in original dataset: {len(df)}")
    print(f"[*] Original columns: {list(df.columns)}")
    
    text_col, cat_col = identify_relevant_columns(df)
    
    if not text_col:
        raise ValueError(f"Could not automatically detect complaint text column. Please specify column from: {list(df.columns)}")
        
    print(f"[+] Found Text column: '{text_col}'")
    if cat_col:
        print(f"[+] Found Category column: '{cat_col}'")
        
    # Drop rows where text is empty or missing
    df = df.dropna(subset=[text_col])
    df[text_col] = df[text_col].astype(str).str.strip()
    df = df[df[text_col].str.len() > 10]
    
    # Filter only relevant columns (discard financial, banking, credit card, personal ID data)
    selected_cols = [text_col]
    if cat_col and cat_col != text_col:
        selected_cols.append(cat_col)
        
    # Keep optional location/date if present
    for extra in ['location', 'city', 'state', 'date', 'priority', 'status']:
        for col in df.columns:
            if extra in str(col).lower():
                selected_cols.append(col)
                break
                
    filtered_df = df[list(set(selected_cols))].copy()
    
    # Map category to Civic Redressal Departments
    def map_to_civic_dept(row):
        text = (str(row.get(text_col, '')) + ' ' + str(row.get(cat_col, ''))).lower()
        for dept, keywords in VALID_CIVIC_DEPARTMENTS.items():
            if any(kw in text for kw in keywords):
                return dept
        return 'Sanitation' # Default civic department fallback
        
    filtered_df['Target_Department'] = filtered_df.apply(map_to_civic_dept, axis=1)
    
    print(f"[+] Filtered dataset rows suitable for project: {len(filtered_df)}")
    print(f"[+] Department Distribution:\n{filtered_df['Target_Department'].value_counts()}")
    
    return filtered_df, text_col, 'Target_Department'

def train_model(df, text_col, target_col):
    """
    Trains TF-IDF vectorizer + Logistic Regression model.
    """
    print("\n[*] Splitting Train/Test (80% / 20%)...")
    X = df[text_col]
    y = df[target_col]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y if len(y.unique()) > 1 and min(y.value_counts()) >= 2 else None
    )
    
    print("[*] Vectorizing complaint text using TF-IDF (unigram + bigrams)...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words='english',
        ngram_range=(1, 2),
        sublinear_tf=True
    )
    
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    print("[*] Training Classifier Model (Logistic Regression)...")
    model = LogisticRegression(max_iter=1000, C=1.0)
    model.fit(X_train_vec, y_train)
    
    # Evaluation
    y_pred = model.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)
    
    print("\n" + "="*50)
    print(f" MODEL TRAINING COMPLETE: Accuracy = {acc * 100:.2f}%")
    print("="*50)
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # Save artifacts
    os.makedirs('ml_model/artifacts', exist_ok=True)
    joblib.dump(model, 'ml_model/artifacts/grievance_model.pkl')
    joblib.dump(vectorizer, 'ml_model/artifacts/tfidf_vectorizer.pkl')
    df.to_csv('ml_model/artifacts/cleaned_civic_complaints.csv', index=False)
    
    print("\n[+] Model and Vectorizer saved to 'ml_model/artifacts/' successfully!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
    else:
        filepath = "kaggle_dataset.xlsx"
        
    if not os.path.exists(filepath):
        print(f"[!] File '{filepath}' not found.")
        print("[!] Usage: python ml_model/train_from_excel.py <path_to_excel_or_csv>")
    else:
        df, text_col, target_col = filter_suitable_dataset(filepath)
        train_model(df, text_col, target_col)
