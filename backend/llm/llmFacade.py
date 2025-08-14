import boto3
import json
import uuid

def agent_facade(prompt):
    print(f"Invoking agent with prompt: {prompt}")
    agents_runtime_client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")

    response = agents_runtime_client.invoke_agent(
        agentId="XKFFWBWHGM",
        inputText=prompt,
        agentAliasId="ZJEFSE80VZ",
        sessionId=f"session-{uuid.uuid4()}",
    )

    completion = ""
    for event in response.get("completion"):
        chunk = event["chunk"]
        completion += chunk["bytes"].decode()
    return completion

if __name__ == "__main__":
    # Test
    raw = agent_facade("Create a workflow that sends a Telegram message using bot sigma18")
    print(f"\033[93mRaw JSON from agent:\033[0m {raw}")
    print()
    try:
        flow = json.loads(raw)
        print("Parsed flow:", flow)
    except json.JSONDecodeError:
        print("Failed to decode JSON response")