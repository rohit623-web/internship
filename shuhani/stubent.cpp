#include <iostream>
#include <fstream>
#include <iomanip>
#include <string>

using namespace std;

// Structure to represent a Student record
struct Student {
    int rollNo;
    string name;
    int age;
    string course;
};

// Function declarations
void addStudent();
void displayStudents();
void searchStudent();
void updateStudent();
void deleteStudent();

int main() {
    int choice;

    while (true) {
        cout << "\n=========================================" << endl;
        cout << "       STUDENT MANAGEMENT SYSTEM         " << endl;
        cout << "=========================================" << endl;
        cout << "1. Add Student Record" << endl;
        cout << "2. Display All Students" << endl;
        cout << "3. Search Student by Roll No" << endl;
        cout << "4. Update Student Record" << endl;
        cout << "5. Delete Student Record" << endl;
        cout << "6. Exit" << endl;
        cout << "-----------------------------------------" << endl;
        cout << "Enter your choice (1-6): ";
        cin >> choice;

        switch (choice) {
            case 1:
                addStudent();
                break;
            case 2:
                displayStudents();
                break;
            case 3:
                searchStudent();
                break;
            case 4:
                updateStudent();
                break;
            case 5:
                deleteStudent();
                break;
            case 6:
                cout << "\nThank you for using the system. Goodbye!" << endl;
                return 0;
            default:
                cout << "\nInvalid choice! Please try again." << endl;
        }
    }
    return 0;
}

// 1. Function to add a new student record to the file
void addStudent() {
    ofstream outFile("students.txt", ios::app); // Open in append mode
    if (!outFile) {
        cout << "\nError opening file!" << endl;
        return;
    }

    Student s;
    cout << "\nEnter Roll Number: ";
    cin >> s.rollNo;
    cin.ignore(); // Clear newline character from buffer
    cout << "Enter Name: ";
    getline(cin, s.name);
    cout << "Enter Age: ";
    cin >> s.age;
    cin.ignore();
    cout << "Enter Course: ";
    getline(cin, s.course);

    // Write data to file separated by spaces/newlines
    outFile << s.rollNo << endl;
    outFile << s.name << endl;
    outFile << s.age << endl;
    outFile << s.course << endl;

    outFile.close();
    cout << "\nRecord added successfully!" << endl;
}

// 2. Function to display all student records from the file
void displayStudents() {
    ifstream inFile("students.txt");
    if (!inFile) {
        cout << "\nNo records found! (File does not exist yet)" << endl;
        return;
    }

    Student s;
    cout << "\n-------------------------------------------------------------" << endl;
    cout << left << setw(10) << "Roll No" << setw(25) << "Name" << setw(8) << "Age" << setw(15) << "Course" << endl;
    cout << "-------------------------------------------------------------" << endl;

    // Read until the end of file
    while (inFile >> s.rollNo) {
        inFile.ignore();
        getline(inFile, s.name);
        inFile >> s.age;
        inFile.ignore();
        getline(inFile, s.course);

        cout << left << setw(10) << s.rollNo << setw(25) << s.name << setw(8) << s.age << setw(15) << s.course << endl;
    }
    cout << "-------------------------------------------------------------" << endl;
    inFile.close();
}

// 3. Function to search for a specific student record
void searchStudent() {
    ifstream inFile("students.txt");
    if (!inFile) {
        cout << "\nNo records found!" << endl;
        return;
    }

    int targetRoll;
    cout << "\nEnter Roll Number to search: ";
    cin >> targetRoll;

    Student s;
    bool found = false;

    while (inFile >> s.rollNo) {
        inFile.ignore();
        getline(inFile, s.name);
        inFile >> s.age;
        inFile.ignore();
        getline(inFile, s.course);

        if (s.rollNo == targetRoll) {
            cout << "\nRecord Found!" << endl;
            cout << "Roll No : " << s.rollNo << endl;
            cout << "Name    : " << s.name << endl;
            cout << "Age     : " << s.age << endl;
            cout << "Course  : " << s.course << endl;
            found = true;
            break;
        }
    }

    if (!found) {
        cout << "\nRecord with Roll Number " << targetRoll << " not found." << endl;
    }
    inFile.close();
}

// 4. Function to update an existing record
void updateStudent() {
    ifstream inFile("students.txt");
    if (!inFile) {
        cout << "\nNo records found!" << endl;
        return;
    }

    int targetRoll;
    cout << "\nEnter Roll Number to update: ";
    cin >> targetRoll;

    ofstream tempFile("temp.txt"); // Create a temporary file
    Student s;
    bool found = false;

    while (inFile >> s.rollNo) {
        inFile.ignore();
        getline(inFile, s.name);
        inFile >> s.age;
        inFile.ignore();
        getline(inFile, s.course);

        // If it matches, ask for new details
        if (s.rollNo == targetRoll) {
            found = true;
            cout << "\nCurrent Details:" << endl;
            cout << "Name: " << s.name << " | Age: " << s.age << " | Course: " << s.course << endl;
            cout << "\nEnter New Details:" << endl;
            cout << "Enter New Name: ";
            getline(cin, s.name);
            cout << "Enter New Age: ";
            cin >> s.age;
            cin.ignore();
            cout << "Enter New Course: ";
            getline(cin, s.course);
        }

        // Write either updated or unmodified records to temp file
        tempFile << s.rollNo << endl;
        tempFile << s.name << endl;
        tempFile << s.age << endl;
        tempFile << s.course << endl;
    }

    inFile.close();
    tempFile.close();

    // Replace old file with updated temp file
    remove("students.txt");
    rename("temp.txt", "students.txt");

    if (found) {
        cout << "\nRecord updated successfully!" << endl;
    } else {
        cout << "\nRecord not found!" << endl;
    }
}

// 5. Function to delete a student record
void deleteStudent() {
    ifstream inFile("students.txt");
    if (!inFile) {
        cout << "\nNo records found!" << endl;
        return;
    }

    int targetRoll;
    cout << "\nEnter Roll Number to delete: ";
    cin >> targetRoll;

    ofstream tempFile("temp.txt");
    Student s;
    bool found = false;

    while (inFile >> s.rollNo) {
        inFile.ignore();
        getline(inFile, s.name);
        inFile >> s.age;
        inFile.ignore();
        getline(inFile, s.course);

        // Copy everything EXCEPT the target record to the temp file
        if (s.rollNo != targetRoll) {
            tempFile << s.rollNo << endl;
            tempFile << s.name << endl;
            tempFile << s.age << endl;
            tempFile << s.course << endl;
        } else {
            found = true;
        }
    }

    inFile.close();
    tempFile.close();

    remove("students.txt");
    rename("temp.txt", "students.txt");

    if (found) {
        cout << "\nRecord deleted successfully!" << endl;
    } else {
        cout << "\nRecord not found!" << endl;
    }
}