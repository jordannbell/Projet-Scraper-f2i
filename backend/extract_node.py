from bs4 import BeautifulSoup

def extract():
    with open('hellowork_debug.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    
    # Find the first h3, then print its parent 'li'
    h3 = soup.find('h3')
    if h3:
        li = h3.find_parent('li')
        if li:
            with open('hellowork_node.html', 'w', encoding='utf-8') as out:
                out.write(li.prettify())
        else:
            print("No li parent found")
    else:
        print("No h3 found")

if __name__ == '__main__':
    extract()
