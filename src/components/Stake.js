import React, {useState, useEffect} from "react";
import {useEnsAddress, useMoralis} from "react-moralis";
import Moralis from "moralis";

function StakedJSX({stakedList, index, setIndex, createBackHandler, createNextHandler}) {
    const stakedIndex = index;
    const stakedSize = stakedList.length;

    return (
        <div className="NFT-Info">
            <div className="NFT-Image"></div>
            <div className="NFT-Name">{stakedList[stakedIndex].name} #{stakedList[stakedIndex].token}</div>
            <div className="NFT-Left" onClick={() => createBackHandler(setIndex, stakedSize)}>
                <button>Back</button>
            </div>
            <div className="NFT-Right" onClick={() => createNextHandler(setIndex, stakedSize)}>
                <button>Next</button>
            </div>
        </div>
    )
}

async function getTotalClaimed(wallet) {
    const response = await fetch('http://localhost:5000/record/reward-data/' + wallet);
    return response.json();
}

async function getIngame(wallet) {
    const response = await fetch('http://localhost:5000/record/rewards/' + wallet);
    return response.json();
}

function MetamaskLogin({login, logOut, isAuthenticating}) {
    return(
        <div className={"metamask"}>
            <button onClick={login}>Metamask Login via Moralis</button> <br/>
        </div>
    )
}

export default function Stake() {
    const [totalReward, setTotalReward] = useState(0);
    const [wallet, setWallet] = useState('You need to login!');
    const [staked, setStaked] = useState([]);
    const [stakedJSX, setStakedJSX] = useState('');
    const [rewardHistory, setRewardHistory] = useState(0);

    const [stakeIndex, setStakeIndex] = useState(0);

    const { authenticate, isAuthenticated, isAuthenticating, user, account, logout } = useMoralis();

    useEffect(() => {
        if(staked.length !== 0) {
            setStakedJSX(<StakedJSX stakedList={staked} index={stakeIndex} setIndex={setStakeIndex} createNextHandler={createNextHandler(setStakeIndex, staked.length)} createBackHandler={createBackHandler(setStakeIndex, staked.length)} />)
        } else if(staked.length === 0) {
            if(isAuthenticated) {
                setStakedJSX(<center>You don't have any staked NFTs.</center>)
            }
        }
    }, [staked, stakeIndex])

    useEffect(() => {
        if(staked.length !== 0) {
            let value = 0;

            staked.forEach((s) => {
                value = value + (s.time * 0.00005787037)
            })
            if(rewardHistory !== undefined) {
                value = value - rewardHistory;
            }
            setTotalReward(value);
        }
    }, [staked, rewardHistory])

    function createNextHandler(setter, length) {
        return () => setter((x) => (x + 1) % length)
    }

    function createBackHandler(setter, length) {
        return () => setter((x) => (x - 1 + length) % length)
    }

    useEffect(() => {
        if (isAuthenticated) {
            setWallet(user.get("ethAddress"))
            getStakedNFTs(user.get("ethAddress")).then(response => {
                setStaked(response)
            })
            getTotalClaimed(user.get('ethAddress')).then(response => {
                if(response != null) {
                    setRewardHistory(response.totalclaimed);
                } else {
                    setRewardHistory(0);
                }
            });
        } else {
            setStaked([]);
            setTotalReward(0);
            setStakedJSX(<MetamaskLogin login={login} logOut={logOut} isAuthenticating={isAuthenticating}/>)

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isAuthenticating]);

    const getStakedNFTs = async(walletAd) => {
        await Moralis.enableWeb3();
        const options = { chain: "rinkeby", address: "0x7Cc55b6b33a571b3eD52006094101474b07f5b0B", token_address: "0xe5C4F856F68461bb2411ceB6F003De0F45CAB7E6" };
        const stakedNFTs = await Moralis.Web3API.account.getNFTsForContract(options);
        const ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"getStakeOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"getStakeTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"onERC721Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"stakes","outputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"startTime","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"}];
        let stakeds = [];

        for(const nft of stakedNFTs.result) {
            const readOptions = {
                contractAddress: "0x7Cc55b6b33a571b3eD52006094101474b07f5b0B",
                functionName: "getStakeOwner",
                abi: ABI,
                params: {
                    _id: nft.token_id
                }
            };

            const nftOwner = await Moralis.executeFunction(readOptions);
            const readOptions2 = {
                contractAddress: "0x7Cc55b6b33a571b3eD52006094101474b07f5b0B",
                functionName: "getStakeTime",
                abi: ABI,
                params: {
                    _id: nft.token_id
                }
            };

            const nftTime = await Moralis.executeFunction(readOptions2);
            if(nftOwner.toString().toUpperCase() === walletAd.toUpperCase()) {
                const stakedNFTData = {name: nft.name, token: nft.token_id, time: parseInt(nftTime._hex, 16)}
                stakeds.push(stakedNFTData);
            }
        }
        await Moralis.deactivateWeb3()
        return stakeds;
    }

    const login = async () => {
        if (!isAuthenticated) {

            await authenticate({signingMessage: "Legends of Atlantis - Connecting for the Staking rewards." })
                .then(function (user) {
                    // console.log("logged in user:", user);
                    // console.log(user.get("ethAddress"));
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    }

    const logOut = async () => {
        setWallet('You need to log in!')
        await logout();
    }

    const claimRewards = async () => {
        if(isAuthenticated) {
            const currentReward = totalReward;
            if(currentReward < 5) {
                window.alert("Minimum amount of token claiming is 5 Atlantium Token!")
                return;
            }
            const currentHistory = rewardHistory;
            const wallet = user.get('ethAddress');
            if(wallet.length < 3) {
                window.alert("Log in using Metamask!")
                return;
            }
            const newTotalClaim = totalReward.valueOf() + currentHistory.valueOf();
            // console.log(currentReward + " + " + currentHistory + " = " + newTotalClaim )

            // WEBSITE REWARD DATABASE
            let delBody = { method: 'DELETE' }
            await fetch('http://localhost:5000/reward-data/' + wallet, delBody)

            let body = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: wallet, totalclaimed: newTotalClaim })
            }

            fetch('http://localhost:5000/record/reward-data/add', body)

            // IN-GAME REWARD DATABASE
            const json = await getIngame(wallet);
            let ingameReward = 0.00;
            if(json !== null) ingameReward = json.reward;

            delBody = { method: 'DELETE' }
            await fetch('http://localhost:5000/rewards/' + wallet, delBody)

            body = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: wallet, reward: currentReward + ingameReward })
            }

            await fetch('http://localhost:5000/record/rewards/add', body)

            window.alert("You successfully claimed your reward! Use /stakeclaim in-game to get the tokens!")
            window.location.reload()

        } else {
            window.alert("Log in using Metamask!")
            return;
        }
    }

    return(
        <div className="stakeBody">
            <div className="atlantisLogo">
                <img src="https://www.legendsofatlantisnft.com/raffle/images/logo.svg" />
            </div>
            <div className="stakeMenu">
                <div className="stakeTitle">Claiming Staking Rewards</div>
                <div className="stakedNFTs">
                    <p>Staked NFTs</p>
                    <hr />
                    {stakedJSX}
                </div>
                <div className="stakeInfo">
                    <div className="stakeInfoText">You have <b>{totalReward} Atlantium Token</b> to claim!</div>
                    <div className="stakeInfoSmall"><i>Your wallet has {staked.length} staked NFTs.</i></div>
                </div>
                <div className="claimRewardButton">
                    <button onClick={claimRewards}>Claim Staking Rewards</button>
                    <i>Wallet Address: {wallet}</i>
                </div>
            </div>
            <div className="logout"><button onClick={logOut} disabled={isAuthenticating}>Logout</button></div>
        </div>
    )
}

