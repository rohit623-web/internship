#include <iostream>
#include <fstream>
#include <iomanip>
#include <string>

using namespace std;

// Class to handle individual bank accounts
class BankAccount {
private:
    int accountNumber;
    char name[50];
    double balance;

public:
    // Default constructor
    BankAccount() {
        accountNumber = 0;
        balance = 0.0;
    }

    // Function to create a new account
    void createAccount() {
        cout << "\nEnter Account Number: ";
        cin >> accountNumber;
        cin.ignore(); // Clear the input buffer
        cout << "Enter Account Holder Name: ";
        cin.getline(name, 50);
        cout << "Enter Initial Deposit Amount: ₹";
        cin >> balance;
        cout << "\nAccount Created Successfully!";
    }

    // Function to display account details
    void displayAccount() const {
        cout << "\n-----------------------------------";
        cout << "\nAccount Number : " << accountNumber;
        cout << "\nAccount Holder : " << name;
        cout << "\nCurrent Balance: ₹" << fixed << setprecision(2) << balance;
        cout << "\n-----------------------------------";
    }

    // Function to deposit money
    void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            cout << "\n₹" << amount << " deposited successfully.";
        } else {
            cout << "\nInvalid deposit amount.";
        }
    }

    // Function to withdraw money
    void withdraw(double amount) {
        if (amount > balance) {
            cout << "\nInsufficient balance! Transaction failed.";
        } else if (amount <= 0) {
            cout << "\nInvalid withdrawal amount.";
        } else {
            balance -= amount;
            cout << "\n₹" << amount << " withdrawn successfully.";
        }
    }

    // Getter for account number
    int getAccountNumber() const {
        return accountNumber;
    }

    // Getter for balance
    double getBalance() const {
        return balance;
    }
};

// Global helper functions for File Handling
void writeAccountToFile();
void displayAccountDetails(int accountNum);
void performTransaction(int accountNum, int option);

int main() {
    int choice;
    int accNum;

    do {
        cout << "\n=================================";
        cout << "\n    BANK MANAGEMENT SYSTEM       ";
        cout << "\n=================================";
        cout << "\n1. Open New Account";
        cout << "\n2. Check Balance / Account Info";
        cout << "\n3. Deposit Money";
        cout << "\n4. Withdraw Money";
        cout << "\n5. Exit";
        cout << "\n=================================";
        cout << "\nEnter your choice (1-5): ";
        cin >> choice;

        switch (choice) {
            case 1:
                writeAccountToFile();
                break;
            case 2:
                cout << "\nEnter Account Number: ";
                cin >> accNum;
                displayAccountDetails(accNum);
                break;
            case 3:
                cout << "\nEnter Account Number: ";
                cin >> accNum;
                performTransaction(accNum, 1); // 1 for Deposit
                break;
            case 4:
                cout << "\nEnter Account Number: ";
                cin >> accNum;
                performTransaction(accNum, 2); // 2 for Withdraw
                break;
            case 5:
                cout << "\nThank you for using our banking system. Goodbye!\n";
                break;
            default:
                cout << "\nInvalid choice! Please try again.";
        }
    } while (choice != 5);

    return 0;
}

// Function to write a new record to the binary file
void writeAccountToFile() {
    BankAccount account;
    ofstream outFile;
    
    // Open in append and binary mode
    outFile.open("bank_data.dat", ios::binary | ios::app);
    
    if (!outFile) {
        cout << "\nFile error! Could not open database.";
        return;
    }
    
    account.createAccount();
    // Write the object data to the file
    outFile.write(reinterpret_cast<char*>(&account), sizeof(BankAccount));
    outFile.close();
}

// Function to read and display a specific record from the binary file
void displayAccountDetails(int accountNum) {
    BankAccount account;
    ifstream inFile;
    bool found = false;

    inFile.open("bank_data.dat", ios::binary);
    if (!inFile) {
        cout << "\nNo accounts found in the system database.";
        return;
    }

    while (inFile.read(reinterpret_cast<char*>(&account), sizeof(BankAccount))) {
        if (account.getAccountNumber() == accountNum) {
            account.displayAccount();
            found = true;
            break;
        }
    }
    
    inFile.close();
    if (!found) {
        cout << "\nAccount Number " << accountNum << " does not exist.";
    }
}

// Function to update balance (Deposit/Withdraw) and write it back to the file
void performTransaction(int accountNum, int option) {
    BankAccount account;
    fstream file;
    bool found = false;
    double amount;

    // Open in read & write binary mode
    file.open("bank_data.dat", ios::binary | ios::in | ios::out);
    if (!file) {
        cout << "\nSystem database error.";
        return;
    }

    while (file.read(reinterpret_cast<char*>(&account), sizeof(BankAccount)) && !found) {
        if (account.getAccountNumber() == accountNum) {
            found = true;
            account.displayAccount();

            if (option == 1) { // Deposit
                cout << "\nEnter amount to deposit: ₹";
                cin >> amount;
                account.deposit(amount);
            } 
            else if (option == 2) { // Withdraw
                cout << "\nEnter amount to withdraw: ₹";
                cin >> amount;
                account.withdraw(amount);
            }

            // Move the file pointer back to the start of this specific object record
            int pos = (-1) * static_cast<int>(sizeof(BankAccount));
            file.seekp(pos, ios::cur);
            
            // Rewrite the updated object over the old data
            file.write(reinterpret_cast<char*>(&account), sizeof(BankAccount));
            cout << "\nRecord Updated Successfully!";
        }
    }

    file.close();
    if (!found) {
        cout << "\nAccount Number " << accountNum << " not found.";
    }
}