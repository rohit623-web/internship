#include <iostream>
#include <fstream>
#include <iomanip>
#include <string>
#include <cstring>

using namespace std;

// ==========================================
// 1. BOOK CLASS
// ==========================================
class Book {
private:
    int bookID;
    char title[50];
    char author[50];
    bool isIssued;
    int issuedToMemberID;

public:
    void createBook() {
        cout << "\nEnter Book ID: ";
        cin >> bookID;
        cin.ignore(); // Clear input buffer
        cout << "Enter Book Title: ";
        cin.getline(title, 50);
        cout << "Enter Author Name: ";
        cin.getline(author, 50);
        isIssued = false;
        issuedToMemberID = -1;
        cout << "\n> Book Added Successfully!\n";
    }

    void showBookDetails() const {
        cout << left << setw(10) << bookID 
             << setw(25) << title 
             << setw(20) << author 
             << setw(15) << (isIssued ? "Issued" : "Available") << endl;
    }

    int getBookID() const { return bookID; }
    const char* getTitle() const { return title; }
    const char* getAuthor() const { return author; }
    bool checkIssuedStatus() const { return isIssued; }
    
    void issueBook(int memberID) {
        isIssued = true;
        issuedToMemberID = memberID;
    }
    
    void returnBook() {
        isIssued = false;
        issuedToMemberID = -1;
    }
};

// ==========================================
// 2. MEMBER CLASS
// ==========================================
class Member {
private:
    int memberID;
    char name[50];

public:
    void createMember() {
        cout << "\nEnter Member ID: ";
        cin >> memberID;
        cin.ignore();
        cout << "Enter Member Name: ";
        cin.getline(name, 50);
        cout << "\n> Member Registered Successfully!\n";
    }

    void showMemberDetails() const {
        cout << left << setw(15) << memberID 
             << setw(30) << name << endl;
    }

    int getMemberID() const { return memberID; }
    const char* getMemberName() const { return name; }
};

// ==========================================
// 3. FILE HANDLING FUNCTIONS
// ==========================================

// Add a new book record to file
void addBookToFile() {
    Book b;
    ofstream outFile("books.dat", ios::binary | ios::app);
    if (!outFile) {
        cout << "Error opening file!\n";
        return;
    }
    b.createBook();
    outFile.write(reinterpret_cast<char*>(&b), sizeof(Book));
    outFile.close();
}

// Add a new member record to file
void addMemberToFile() {
    Member m;
    ofstream outFile("members.dat", ios::binary | ios::app);
    if (!outFile) {
        cout << "Error opening file!\n";
        return;
    }
    m.createMember();
    outFile.write(reinterpret_cast<char*>(&m), sizeof(Member));
    outFile.close();
}

// Display all books
void displayAllBooks() {
    Book b;
    ifstream inFile("books.dat", ios::binary);
    if (!inFile) {
        cout << "\nNo book records found. Add books first!\n";
        return;
    }
    cout << "\n====================================================================\n";
    cout << left << setw(10) << "Book ID" << setw(25) << "Title" << setw(20) << "Author" << setw(15) << "Status" << endl;
    cout << "====================================================================\n";
    while (inFile.read(reinterpret_cast<char*>(&b), sizeof(Book))) {
        b.showBookDetails();
    }
    cout << "====================================================================\n";
    inFile.close();
}

// Display all members
void displayAllMembers() {
    Member m;
    ifstream inFile("members.dat", ios::binary);
    if (!inFile) {
        cout << "\nNo member records found. Register members first!\n";
        return;
    }
    cout << "\n=============================================\n";
    cout << left << setw(15) << "Member ID" << setw(30) << "Name" << endl;
    cout << "=============================================\n";
    while (inFile.read(reinterpret_cast<char*>(&m), sizeof(Member))) {
        m.showMemberDetails();
    }
    cout << "=============================================\n";
    inFile.close();
}

// Search for a book by Title or Author
void searchBook() {
    ifstream inFile("books.dat", ios::binary);
    if (!inFile) {
        cout << "\nNo book records found.\n";
        return;
    }
    
    int choice;
    cout << "\nSearch Book By:\n1. Title\n2. Author\nEnter choice: ";
    cin >> choice;
    cin.ignore();
    
    char query[50];
    cout << "Enter search keyword: ";
    cin.getline(query, 50);
    
    Book b;
    bool found = false;
    
    cout << "\n====================================================================\n";
    cout << left << setw(10) << "Book ID" << setw(25) << "Title" << setw(20) << "Author" << setw(15) << "Status" << endl;
    cout << "====================================================================\n";
    
    while (inFile.read(reinterpret_cast<char*>(&b), sizeof(Book))) {
        if ((choice == 1 && strstr(b.getTitle(), query) != NULL) || 
            (choice == 2 && strstr(b.getAuthor(), query) != NULL)) {
            b.showBookDetails();
            found = true;
        }
    }
    cout << "====================================================================\n";
    
    if (!found) {
        cout << "No matching books found.\n";
    }
    inFile.close();
}

// Process Book Issue
void issueBookTransaction() {
    int targetBookID, targetMemberID;
    cout << "\nEnter Book ID to Issue: ";
    cin >> targetBookID;
    cout << "Enter Member ID: ";
    cin >> targetMemberID;
    
    // Check if member exists
    Member m;
    bool memberExists = false;
    ifstream memberFile("members.dat", ios::binary);
    while (memberFile.read(reinterpret_cast<char*>(&m), sizeof(Member))) {
        if (m.getMemberID() == targetMemberID) {
            memberExists = true;
            break;
        }
    }
    memberFile.close();
    
    if (!memberExists) {
        cout << "\n> Error: Member ID not registered!\n";
        return;
    }
    
    // Find and update the book status
    fstream bookFile("books.dat", ios::binary | ios::in | ios::out);
    Book b;
    bool bookFound = false;
    
    while (bookFile.read(reinterpret_cast<char*>(&b), sizeof(Book))) {
        if (b.getBookID() == targetBookID) {
            bookFound = true;
            if (b.checkIssuedStatus()) {
                cout << "\n> Error: This book is already issued to someone else.\n";
            } else {
                b.issueBook(targetMemberID);
                // Move writing pointer back to overwrite this specific block
                int pos = -1 * static_cast<int>(sizeof(Book));
                bookFile.seekp(pos, ios::cur);
                bookFile.write(reinterpret_cast<char*>(&b), sizeof(Book));
                cout << "\n> Success: Book successfully issued to " << m.getMemberName() << ".\n";
            }
            break;
        }
    }
    if (!bookFound) cout << "\n> Error: Book ID not found.\n";
    bookFile.close();
}

// Process Book Return
void returnBookTransaction() {
    int targetBookID;
    cout << "\nEnter Book ID to Return: ";
    cin >> targetBookID;
    
    fstream bookFile("books.dat", ios::binary | ios::in | ios::out);
    Book b;
    bool bookFound = false;
    
    while (bookFile.read(reinterpret_cast<char*>(&b), sizeof(Book))) {
        if (b.getBookID() == targetBookID) {
            bookFound = true;
            if (!b.checkIssuedStatus()) {
                cout << "\n> Notification: This book is already inside the library.\n";
            } else {
                b.returnBook();
                int pos = -1 * static_cast<int>(sizeof(Book));
                bookFile.seekp(pos, ios::cur);
                bookFile.write(reinterpret_cast<char*>(&b), sizeof(Book));
                cout << "\n> Success: Book successfully returned back to library records.\n";
            }
            break;
        }
    }
    if (!bookFound) cout << "\n> Error: Book ID not found.\n";
    bookFile.close();
}

// ==========================================
// 4. MAIN MENU-DRIVEN APP
// ==========================================
int main() {
    int choice;
    do {
        cout << "\n====================================\n";
        cout << "     LIBRARY MANAGEMENT SYSTEM      \n";
        cout << "====================================\n";
        cout << "1. Add New Book\n";
        cout << "2. Register New Member\n";
        cout << "3. Display All Books\n";
        cout << "4. Display All Members\n";
        cout << "5. Search for a Book\n";
        cout << "6. Issue a Book\n";
        cout << "7. Return a Book\n";
        cout << "8. Exit\n";
        cout << "====================================\n";
        cout << "Enter your choice (1-8): ";
        cin >> choice;
        
        switch(choice) {
            case 1: addBookToFile(); break;
            case 2: addMemberToFile(); break;
            case 3: displayAllBooks(); break;
            case 4: displayAllMembers(); break;
            case 5: searchBook(); break;
            case 6: issueBookTransaction(); break;
            case 7: returnBookTransaction(); break;
            case 8: cout << "\nThank you for using the Library System!\n"; break;
            default: cout << "\nInvalid Choice! Please try again.\n";
        }
    } while(choice != 8);
    
    return 0;
}