import accountModel from "../models/accountmodels.js";


export const registerAccount = async (req, res)=>{
    try {
        const user = req.user;
        // const existingAccount = await accountModel.findOne({ user: user._id, status: "ACTIVE" });
        // if (existingAccount) {
        //     return res.status(400).json({
        //         message: "Account already exists for this user",
        //         account: existingAccount 
        //     });
        // }
        // 1. Fixed: Added await and assigned to 'account' variable
        const account = await accountModel.create({ user: user._id  , currency: req.body.currency || "INR"});

        return res.status(201).json({
            message: "Account created successfully",
            account // Now this is defined!
        });
    } catch (error) {
        console.error("Account Creation Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
} 

export const getUserAccountsController = async (req, res)=> {

    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
        accounts
    })
}

export const getAccountBalanceController = async(req, res)=> {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}


